package pl.jakub.ambulancemanagement.routes.service;


import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.jakub.ambulancemanagement.ambulances.model.Ambulance;
import pl.jakub.ambulancemanagement.auth.security.CurrentUserService;
import pl.jakub.ambulancemanagement.exception.ApiException;
import pl.jakub.ambulancemanagement.exception.ErrorCode;
import pl.jakub.ambulancemanagement.route_members.dto.RouteMemberResponse;
import pl.jakub.ambulancemanagement.route_members.model.RouteMember;
import pl.jakub.ambulancemanagement.route_members.model.RouteMemberRole;
import pl.jakub.ambulancemanagement.route_members.model.RouteMemberSource;
import pl.jakub.ambulancemanagement.route_members.repository.RouteMemberRepository;
import pl.jakub.ambulancemanagement.route_orders.model.RouteOrder;
import pl.jakub.ambulancemanagement.route_orders.model.RouteOrderStatus;
import pl.jakub.ambulancemanagement.route_orders.repository.RouteOrderRepository;
import pl.jakub.ambulancemanagement.routes.dto.*;
import pl.jakub.ambulancemanagement.routes.model.Route;
import pl.jakub.ambulancemanagement.routes.model.RouteOrderFinishAction;
import pl.jakub.ambulancemanagement.routes.model.RouteStatus;
import pl.jakub.ambulancemanagement.routes.repository.RouteRepository;
import pl.jakub.ambulancemanagement.shift_default_members.model.ShiftDefaultMember;
import pl.jakub.ambulancemanagement.shift_default_members.repository.ShiftDefaultMemberRepository;
import pl.jakub.ambulancemanagement.shifts.model.Shift;
import pl.jakub.ambulancemanagement.shifts.model.ShiftStatus;
import pl.jakub.ambulancemanagement.shifts.repository.ShiftRepository;
import pl.jakub.ambulancemanagement.transport_order_patient_data.dto.TransportOrderPatientDataResponse;
import pl.jakub.ambulancemanagement.transport_order_patient_data.repository.TransportOrderPatientDataRepository;
import pl.jakub.ambulancemanagement.transport_orders.dto.CancelTransportOrderRequest;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportOrder;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportStatus;
import pl.jakub.ambulancemanagement.transport_orders.repository.TransportOrderRepository;
import pl.jakub.ambulancemanagement.users.model.User;
import pl.jakub.ambulancemanagement.users.model.UserRole;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RouteService {

    private final RouteRepository routeRepository;
    private final TransportOrderRepository transportOrderRepository;
    private final ShiftRepository shiftRepository;
    private final RouteOrderRepository routeOrderRepository;
    private final TransportOrderPatientDataRepository transportOrderPatientDataRepository;
    private final RouteMemberRepository routeMemberRepository;
    private final CurrentUserService currentUserService;
    private final ShiftDefaultMemberRepository shiftDefaultMemberRepository;

    public List<Route> getAllRoutes() {
        return routeRepository.findAll();
    }

    public Route getRouteById(Long id) {
        return routeRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.ROUTE_NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public List<RouteResponse> getMyRoutes() {
        User currentUser = currentUserService.getCurrentUser();
        return routeRepository.findMyRoutes(currentUser.getId())
                .stream()
                .map(RouteResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public RouteResponse getMyRouteById(Long routeId) {
        User currentUser = currentUserService.getCurrentUser();

        Route route = routeRepository.findMyRouteById(routeId, currentUser.getId())
                .orElseThrow(() -> new ApiException(ErrorCode.ROUTE_NOT_FOUND));
        return RouteResponse.fromEntity(route);
    }

    @Transactional
    public Route createRoute(RouteCreateRequest request) {

        Shift shift = shiftRepository.findById(request.getShiftId())
                .orElseThrow(() -> new ApiException(ErrorCode.SHIFT_NOT_FOUND));

        if (shift.getStatus() != ShiftStatus.ACTIVE) {
            throw new ApiException(ErrorCode.SHIFT_NOT_ACTIVE);
        }

        validateCurrentUserCanUseShift(shift);

        Route route = new Route();
        route.setShift(shift);
        route.setStartAddress(request.getStartAddress());
        route.setActualDestinationAddress(request.getActualDestinationAddress());
        route.setNotes(request.getNotes());
        route.setStatus(RouteStatus.CREATED);

        Route savedRoute = routeRepository.save(route);

        List<RouteOrder> routeOrders = new ArrayList<>();

        int position = 1;

        for (Long transportOrderId : request.getTransportOrderIds()) {
            TransportOrder transportOrder = transportOrderRepository.findById(transportOrderId)
                    .orElseThrow(() -> new ApiException(ErrorCode.TRANSPORT_ORDER_NOT_FOUND));

            if (transportOrder.getStatus() != TransportStatus.NEW
                    && transportOrder.getStatus() != TransportStatus.WAITING_FOR_PICKUP) {
                throw new ApiException(ErrorCode.TRANSPORT_ORDER_NOT_AVAILABLE);
            }

            boolean alreadyAssignedToActiveRoute = routeOrderRepository.existsByTransportOrder_IdAndRoute_StatusIn(
                    transportOrderId,
                    List.of(RouteStatus.CREATED, RouteStatus.IN_PROGRESS, RouteStatus.WAITING)
            );

            if (alreadyAssignedToActiveRoute) {
                throw new ApiException(ErrorCode.TRANSPORT_ORDER_ALREADY_ASSIGNED_TO_ACTIVE_ROUTE);
            }

            // Zlecenie jest IN_PROGRESS od momentu przyjęcia przez załogę
            // i utworzenia trasy, nawet jeśli karetka jeszcze nie ruszyła.
            transportOrder.setStatus(TransportStatus.IN_PROGRESS);

            RouteOrder routeOrder = new RouteOrder();
            routeOrder.setRoute(savedRoute);
            routeOrder.setTransportOrder(transportOrder);
            routeOrder.setPosition(position++);
            routeOrder.setStatus(RouteOrderStatus.PENDING);

            routeOrders.add(routeOrder);
        }

        routeOrderRepository.saveAll(routeOrders);

        savedRoute.setRouteOrders(routeOrders);

        LocalDateTime routeCreatedAt = LocalDateTime.now();

        addDefaultCrewAsRouteMembers(savedRoute, routeCreatedAt);

        return savedRoute;
    }

    @Transactional
    public Route createRouteFromOrder(Long transportOrderId, RouteCreateFromOrderRequest request) {
        Shift shift = shiftRepository.findById(request.getShiftId())
                .orElseThrow(() -> new ApiException(ErrorCode.SHIFT_NOT_FOUND));

        if (shift.getStatus() != ShiftStatus.ACTIVE) {
            throw new ApiException(ErrorCode.SHIFT_NOT_ACTIVE);
        }

        validateCurrentUserCanUseShift(shift);

        TransportOrder transportOrder = transportOrderRepository.findById(transportOrderId)
                .orElseThrow(() -> new ApiException(ErrorCode.TRANSPORT_ORDER_NOT_FOUND));

        if (transportOrder.getStatus() != TransportStatus.NEW
                && transportOrder.getStatus() != TransportStatus.WAITING_FOR_PICKUP) {
            throw new ApiException(ErrorCode.TRANSPORT_ORDER_NOT_AVAILABLE);
        }

        if (isBlank(transportOrder.getPickupAddress())
                || isBlank(transportOrder.getDestinationAddress())) {
            throw new ApiException(ErrorCode.BOTH_ADDRESS_REQUIRED);
        }

        boolean alreadyAssignedToActiveRoute = routeOrderRepository.existsByTransportOrder_IdAndRoute_StatusIn(
                transportOrderId,
                List.of(RouteStatus.CREATED, RouteStatus.IN_PROGRESS, RouteStatus.WAITING)
        );

        if (alreadyAssignedToActiveRoute) {
            throw new ApiException(ErrorCode.TRANSPORT_ORDER_ALREADY_ASSIGNED_TO_ACTIVE_ROUTE);
        }

        transportOrder.setStatus(TransportStatus.IN_PROGRESS);
        Route route = new Route();
        route.setShift(shift);
        route.setStartAddress(transportOrder.getPickupAddress());
        route.setActualDestinationAddress(transportOrder.getDestinationAddress());
        route.setNotes(normalizeNullableText(request.getNotes()));
        route.setStatus(RouteStatus.CREATED);

        Route savedRoute = routeRepository.save(route);

        RouteOrder routeOrder = new RouteOrder();
        routeOrder.setRoute(savedRoute);
        routeOrder.setTransportOrder(transportOrder);
        routeOrder.setPosition(1);
        routeOrder.setStatus(RouteOrderStatus.PENDING);

        routeOrderRepository.save(routeOrder);

        savedRoute.setRouteOrders(List.of(routeOrder));

        LocalDateTime routeCreatedAt = LocalDateTime.now();

        addDefaultCrewAsRouteMembers(savedRoute, routeCreatedAt);

        return savedRoute;
    }


    @Transactional
    public Route reorderTransportOrders(
            Long routeId,
            RouteTransportOrdersReorderRequest request
    ) {
        Route route = getRouteForCurrentUser(routeId);

        if (route.getStatus() != RouteStatus.CREATED
                && route.getStatus() != RouteStatus.IN_PROGRESS
                && route.getStatus() != RouteStatus.WAITING) {
            throw new ApiException(ErrorCode.ROUTE_TRANSPORT_ORDER_CANNOT_BE_REORDERED);
        }

        List<RouteOrder> routeOrders = routeOrderRepository.findByRoute_IdOrderByPositionAsc(route.getId());

        if (routeOrders.isEmpty()) {
            throw new ApiException(ErrorCode.ROUTE_HAS_NO_TRANSPORT_ORDERS);
        }

        List<Long> requestedTransportOrdersIds = request.getTransportOrderIds();

        Set<Long> requestedTransportOrdersIdSet =
                new HashSet<>(requestedTransportOrdersIds);

        Set<Long> routeTransportOrdersIds =
                routeOrders
                        .stream()
                        .map(routeOrder -> routeOrder.getTransportOrder().getId())
                        .collect(Collectors.toSet());

        boolean hasDuplicates = requestedTransportOrdersIds.size() != requestedTransportOrdersIdSet.size();

        boolean requestDoesNotMatchRouteOrders = !requestedTransportOrdersIdSet.equals(routeTransportOrdersIds);

        if (hasDuplicates || requestDoesNotMatchRouteOrders) {
            throw new ApiException(ErrorCode.TRANSPORT_ORDER_INVALID_REQUEST);
        }

        for(int index = 0; index < routeOrders.size(); index++) {
            RouteOrder routeOrder = routeOrders.get(index);

            boolean isLocked = routeOrder.getStatus() != RouteOrderStatus.PENDING;

            if(isLocked
            && !routeOrder.getTransportOrder().getId().equals(requestedTransportOrdersIds.get(index))) {
                throw new ApiException(ErrorCode.ROUTE_TRANSPORT_ORDER_CANNOT_BE_REORDERED);
            }
        }

        Map<Long, RouteOrder> routeOrdersByTransportOrderId = routeOrders.stream()
                .collect(Collectors.toMap(
                        routeOrder -> routeOrder.getTransportOrder().getId(),
                        routeOrder -> routeOrder
                ));

        for (int index = 0; index < requestedTransportOrdersIds.size(); index++) {
            Long transportOrdersId = requestedTransportOrdersIds.get(index);

            routeOrdersByTransportOrderId.get(transportOrdersId).setPosition(index + 1);
        }
        routeOrderRepository.saveAll(routeOrders);

        return route;
    }

    @Transactional
    public Route addTransportOrderToRoute(
            Long routeId,
            Long transportOrderId
    ) {
        Route route = getRouteForCurrentUser(routeId);

        if (route.getStatus() != RouteStatus.CREATED
                && route.getStatus() != RouteStatus.IN_PROGRESS
                && route.getStatus() != RouteStatus.WAITING) {
            throw new ApiException(ErrorCode.ROUTE_CANNOT_ACCEPT_TRANSPORT_ORDERS);
        }

        TransportOrder transportOrder = transportOrderRepository
                .findById(transportOrderId)
                .orElseThrow(() ->
                        new ApiException(ErrorCode.TRANSPORT_ORDER_NOT_FOUND));

        if (transportOrder.getStatus() != TransportStatus.NEW
                && transportOrder.getStatus() != TransportStatus.WAITING_FOR_PICKUP) {
            throw new ApiException(ErrorCode.TRANSPORT_ORDER_NOT_AVAILABLE);
        }

        boolean alreadyAssignedToActiveRoute =
                routeOrderRepository.existsByTransportOrder_IdAndRoute_StatusIn(
                        transportOrderId,
                        List.of(
                                RouteStatus.CREATED,
                                RouteStatus.WAITING,
                                RouteStatus.IN_PROGRESS
                        )
                );

        if (alreadyAssignedToActiveRoute) {
            throw new ApiException(ErrorCode.TRANSPORT_ORDER_ALREADY_ASSIGNED_TO_ACTIVE_ROUTE);
        }

        List<RouteOrder> routeOrders = routeOrderRepository.findByRoute_IdOrderByPositionAsc(routeId);

        int nextPosition = routeOrders.isEmpty()
                ? 1
                : routeOrders.get(routeOrders.size() - 1).getPosition() + 1;

        RouteOrder routeOrder = new RouteOrder();
        routeOrder.setRoute(route);
        routeOrder.setTransportOrder(transportOrder);
        routeOrder.setPosition(nextPosition);
        routeOrder.setStatus(RouteOrderStatus.PENDING);

        transportOrder.setStatus(TransportStatus.IN_PROGRESS);

        routeOrderRepository.save(routeOrder);

        return route;
    }

    @Transactional
    public Route startRoute(Long id) {
        Route route = getRouteForCurrentUser(id);

        if (route.getStatus() != RouteStatus.CREATED) {
            throw new ApiException(ErrorCode.ROUTE_CANNOT_BE_STARTED);
        }

        List<RouteOrder> routeOrders =
                routeOrderRepository.findByRoute_IdAndStatusOrderByPositionAsc(
                        route.getId(),
                        RouteOrderStatus.PENDING
                );

        if (routeOrders.isEmpty()) {
            throw new ApiException(ErrorCode.ROUTE_HAS_NO_TRANSPORT_ORDERS);
        }

        for (RouteOrder routeOrder : routeOrders) {
            TransportOrder transportOrder = routeOrder.getTransportOrder();

            if (transportOrder.getStatus() == TransportStatus.CANCELLED
                    || transportOrder.getStatus() == TransportStatus.COMPLETED) {
                throw new ApiException(ErrorCode.TRANSPORT_ORDER_NOT_AVAILABLE);
            }

            transportOrder.setStatus(TransportStatus.IN_PROGRESS);

        }

        Integer ambulanceMileage = route.getShift().getAmbulance().getMileage();
        if (ambulanceMileage == null) {
            throw new ApiException(ErrorCode.AMBULANCE_MILEAGE_REQUIRED);
        }

        route.setStartOdometerKm(ambulanceMileage);
        route.setStartedAt(LocalDateTime.now());
        route.setStatus(RouteStatus.IN_PROGRESS);

        return routeRepository.save(route);
    }

    @Transactional
    public Route markRouteAsWaiting(Long id) {
        Route route = getRouteForCurrentUser(id);
        if (route.getStatus() != RouteStatus.IN_PROGRESS) {
            throw new ApiException(ErrorCode.ROUTE_CANNOT_BE_MARKED_AS_WAITING);
        }

        route.setStatus(RouteStatus.WAITING);
        return routeRepository.save(route);
    }

    @Transactional
    public Route resumeRoute(Long id) {
        Route route = getRouteForCurrentUser(id);
        if (route.getStatus() != RouteStatus.WAITING) {
            throw new ApiException(ErrorCode.ROUTE_CANNOT_BE_RESUMED);
        }
        route.setStatus(RouteStatus.IN_PROGRESS);
        return routeRepository.save(route);
    }

    @Transactional
    public Route resolveTransportOrder(
            Long routeId,
            Long transportOrderId,
            RouteOrderResolveRequest request
    ) {
        Route route = getRouteForCurrentUser(routeId);

        if (route.getStatus() != RouteStatus.IN_PROGRESS) {
            throw new ApiException(ErrorCode.ROUTE_CANNOT_BE_FINISHED);
        }

        List<RouteOrder> pendingRouteOrders =
                routeOrderRepository.findByRoute_IdAndStatusOrderByPositionAsc(
                        route.getId(),
                        RouteOrderStatus.PENDING
                );

        if (pendingRouteOrders.isEmpty()) {
            throw new ApiException(ErrorCode.ROUTE_HAS_NO_TRANSPORT_ORDERS);
        }

        RouteOrder nextRouteOrder = pendingRouteOrders.getFirst();

        if (!nextRouteOrder.getTransportOrder().getId().equals(transportOrderId)) {
            throw new ApiException(ErrorCode.TRANSPORT_ORDER_CANNOT_BE_FINISHED);
        }

        TransportOrder transportOrder = nextRouteOrder.getTransportOrder();
        LocalDateTime now = LocalDateTime.now();

        switch (request.action()) {
            case COMPLETE -> {
                transportOrder.setStatus(TransportStatus.COMPLETED);
                transportOrder.setCompletedAt(now);
                nextRouteOrder.setStatus(RouteOrderStatus.COMPLETED);
            }


            case WAITING_FOR_PICKUP -> {
                transportOrder.setStatus(TransportStatus.WAITING_FOR_PICKUP);
                nextRouteOrder.setStatus(RouteOrderStatus.COMPLETED);
            }
        }

        nextRouteOrder.setResolvedAt(now);

        return routeRepository.save(route);
    }

    @Transactional
    public Route cancelTransportOrderInRoute(
            Long routeId,
            Long transportOrderId,
            CancelTransportOrderRequest request
    ) {
        Route route = getRouteForCurrentUser(routeId);

        if(route.getStatus() != RouteStatus.IN_PROGRESS
        && route.getStatus() != RouteStatus.CREATED) {
            throw new ApiException(ErrorCode.ROUTE_TRANSPORT_ORDER_CANNOT_BE_CANCELLED);
        }

        RouteOrder routeOrder = routeOrderRepository.findByRoute_IdAndTransportOrder_Id(
                routeId,
                transportOrderId)
                .orElseThrow(() -> new ApiException(ErrorCode.TRANSPORT_ORDER_NOT_IN_ROUTE));

        if(routeOrder.getStatus() != RouteOrderStatus.PENDING){
            throw new ApiException(ErrorCode.TRANSPORT_ORDER_CANNOT_BE_CANCELLED);
        }

        TransportOrder transportOrder = routeOrder.getTransportOrder();

        if(transportOrder.getStatus() == TransportStatus.CANCELLED){
            throw new ApiException(ErrorCode.TRANSPORT_ORDER_ALREADY_CANCELLED);
        }
        if(transportOrder.getStatus() == TransportStatus.COMPLETED){
            throw new ApiException(ErrorCode.TRANSPORT_ORDER_ALREADY_COMPLETED);
        }

        User cancelledBy = currentUserService.getCurrentUser();

        if(!Boolean.TRUE.equals(cancelledBy.getActive())){
            throw new ApiException(ErrorCode.USER_NOT_ACTIVE);
        }

        LocalDateTime now = LocalDateTime.now();

        transportOrder.setStatus(TransportStatus.CANCELLED);
        transportOrder.setCancelledAt(now);
        transportOrder.setCancelledBy(cancelledBy);
        transportOrder.setCancelReason(request.getCancelReason());
        transportOrder.setCancelDescription(
                normalizeNullableText(request.getCancelDescription())
        );

        routeOrder.setStatus(RouteOrderStatus.CANCELLED);
        routeOrder.setResolvedAt(now);

        return routeRepository.save(route);
    }

    @Transactional
    public Route finishRoute(Long id, RouteFinishRequest request) {
        Route route = getRouteForCurrentUser(id);

        if (route.getStatus() != RouteStatus.IN_PROGRESS) {
            throw new ApiException(ErrorCode.ROUTE_CANNOT_BE_FINISHED);
        }
        List<RouteOrder> routeOrders =
                routeOrderRepository.findByRoute_IdAndStatusOrderByPositionAsc(
                        route.getId(),
                        RouteOrderStatus.PENDING
                );

        if (!routeOrders.isEmpty()) {
            throw new ApiException(ErrorCode.ROUTE_HAS_PENDING_TRANSPORT_ORDERS);
        }

        Integer startOdometerKm = route.getStartOdometerKm();
        if (startOdometerKm == null) {
            throw new ApiException(ErrorCode.ODOMETER_BASE_VALUE_REQUIRED);
        }

        validateLastThreeDigits(request.getFinishOdometerLastThree());

        int finishOdometerKm = calculateFullOdometerFromLastThreeDigits(
                startOdometerKm, request.getFinishOdometerLastThree());

        int distanceKM = finishOdometerKm - startOdometerKm;

        if (distanceKM < 0) {
            throw new ApiException(ErrorCode.INVALID_FINISH_ODOMETER);
        }
        LocalDateTime now = LocalDateTime.now();

        route.setFinishOdometerKm(finishOdometerKm);
        route.setDistanceKm(distanceKM);
        route.setFinishedAt(now);
        route.setStatus(RouteStatus.COMPLETED);

        Ambulance ambulance = route.getShift().getAmbulance();

        BigDecimal fuelConsumptionNorm = getCurrentFuelConsumptionNorm(ambulance);
        BigDecimal estimatedFuelConsumed = calculateEstimatedFuelConsumed(distanceKM, fuelConsumptionNorm);

        route.setFuelConsumptionNormUsed(fuelConsumptionNorm);
        route.setEstimatedFuelConsumedLiters(estimatedFuelConsumed);

        ambulance.setMileage(finishOdometerKm);
        subtractEstimatedFuelAfterRoute(ambulance, estimatedFuelConsumed);


        if (request.getNotes() != null) {
            route.setNotes(normalizeNullableText(request.getNotes()));
        }


        return routeRepository.save(route);
    }

    public RouteDetailsResponse getRouteDetailsById(Long id) {
        Route route = getRouteById(id);

        validateCurrentUserCanAccessRoute(route);

        List<RouteMemberResponse> routeMembers =
                routeMemberRepository.findByRouteIdOrderByCreatedAtAsc(route.getId())
                        .stream()
                        .map(RouteMemberResponse::fromEntity)
                        .toList();

        List<RouteTransportOrderSummaryResponse> transportOrders =
                routeOrderRepository.findByRoute_IdOrderByPositionAsc(route.getId())
                        .stream()
                        .map(routeOrder -> {
                            var transportOrder = routeOrder.getTransportOrder();

                            List<TransportOrderPatientDataResponse> patients =
                                    transportOrderPatientDataRepository.findByTransportOrderId(transportOrder.getId())
                                            .stream()
                                            .map(TransportOrderPatientDataResponse::fromEntity)
                                            .toList();

                            return RouteTransportOrderSummaryResponse.fromEntity(routeOrder, patients);
                        })
                        .toList();

        return RouteDetailsResponse.fromEntity(route, transportOrders, routeMembers);
    }

    private String normalizeNullableText(String value) {

        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private int calculateFullOdometerFromLastThreeDigits(
            int baseOdometerKm, int lastThreeDigits) {

        int thousandsBase = (baseOdometerKm / 1000) * 1000;
        int calculateOdometerKm = thousandsBase + lastThreeDigits;

        if (calculateOdometerKm < baseOdometerKm) {
            calculateOdometerKm += 1000;
        }

        return calculateOdometerKm;
    }

    private void validateLastThreeDigits(Integer lastThreeDigits) {
        if (lastThreeDigits == null || lastThreeDigits < 0 || lastThreeDigits > 999) {
            throw new ApiException(ErrorCode.INVALID_ODOMETER_LAST_DIGITS);
        }
    }


    private BigDecimal getCurrentFuelConsumptionNorm(Ambulance ambulance) {
        Month currentMonth = LocalDate.now().getMonth();

        boolean winterSeason = currentMonth == Month.OCTOBER
                || currentMonth == Month.NOVEMBER
                || currentMonth == Month.DECEMBER
                || currentMonth == Month.JANUARY
                || currentMonth == Month.FEBRUARY
                || currentMonth == Month.MARCH;

        BigDecimal fuelConsumptionNorm = winterSeason
                ? ambulance.getWinterFuelConsumptionNorm()
                : ambulance.getSummerFuelConsumptionNorm();

        if (fuelConsumptionNorm == null) {
            throw new ApiException(ErrorCode.FUEL_CONSUMPTION_NORM_REQUIRED);
        }

        return fuelConsumptionNorm;
    }

    private BigDecimal calculateEstimatedFuelConsumed(int distanceKm, BigDecimal fuelConsumptionNorm) {
        return BigDecimal.valueOf(distanceKm)
                .multiply(fuelConsumptionNorm)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    private void subtractEstimatedFuelAfterRoute(Ambulance ambulance, BigDecimal estimatedFuelConsumed) {
        if (ambulance.getEstimatedFuelLiters() == null) {
            return;
        }

        BigDecimal newEstimatedFuel = ambulance.getEstimatedFuelLiters().subtract(estimatedFuelConsumed);

        if (newEstimatedFuel.compareTo(BigDecimal.ZERO) < 0) {
            newEstimatedFuel = BigDecimal.ZERO;
        }

        ambulance.setEstimatedFuelLiters(newEstimatedFuel);
        ambulance.setFuelEstimateUpdatedAt(LocalDateTime.now());
    }

    private void validateCurrentUserCanAccessRoute(Route route) {
        User currentUser = currentUserService.getCurrentUser();

        if (currentUser.getUserRole() == UserRole.ADMIN ||
                currentUser.getUserRole() == UserRole.MANAGER) {
            return;
        }

        if (route.getShift().getDriver().getId().equals(currentUser.getId())) {
            return;
        }

        boolean isRouteMember = routeMemberRepository.existsByRouteIdAndUserId(
                route.getId(),
                currentUser.getId()
        );

        if (isRouteMember) {
            return;
        }

        throw new ApiException(ErrorCode.ROUTE_ACCESS_DENIED);
    }

    private Route getRouteForCurrentUser(Long routeId) {
        User currentUser = currentUserService.getCurrentUser();

        return routeRepository.findMyRouteById(routeId, currentUser.getId())
                .orElseThrow(() -> new ApiException(ErrorCode.ROUTE_NOT_FOUND));
    }

    private void validateCurrentUserCanUseShift(Shift shift) {
        User currentUser = currentUserService.getCurrentUser();

        if (currentUser.getUserRole() == UserRole.ADMIN ||
                currentUser.getUserRole() == UserRole.MANAGER) {
            return;
        }

        if (!shift.getDriver().getId().equals(currentUser.getId())) {
            throw new ApiException(ErrorCode.ROUTE_ACCESS_DENIED);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private void addDefaultCrewAsRouteMembers(Route route, LocalDateTime routeTime) {
        Shift shift = route.getShift();

        addUserAsRouteMember(
                route,
                shift,
                shift.getDriver(),
                RouteMemberRole.DRIVER,
                RouteMemberSource.SHIFT_TEAM
        );

        List<ShiftDefaultMember> activeMembers =
                shiftDefaultMemberRepository.findActiveMembersForShiftAt(shift.getId(), routeTime);

        for (ShiftDefaultMember activeMember : activeMembers) {
            addUserAsRouteMember(
                    route,
                    shift,
                    activeMember.getUser(),
                    activeMember.getRole(),
                    RouteMemberSource.SHIFT_TEAM
            );
        }
    }

    private void addUserAsRouteMember(
            Route route,
            Shift originShift,
            User user,
            RouteMemberRole role,
            RouteMemberSource source
    ) {
        boolean alreadyAdded = routeMemberRepository.existsByRouteIdAndUserId(
                route.getId(),
                user.getId()
        );
        if (alreadyAdded) {
            return;
        }

        RouteMember routeMember = new RouteMember();

        routeMember.setRoute(route);
        routeMember.setOriginShift(originShift);
        routeMember.setUser(user);
        routeMember.setMemberName(null);
        routeMember.setRole(role);
        routeMember.setSource(source);
        routeMember.setCreatedAt(LocalDateTime.now());

        routeMemberRepository.save(routeMember);
    }
}
