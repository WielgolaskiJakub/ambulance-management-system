package pl.jakub.ambulancemanagement.routes.service;


import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.jakub.ambulancemanagement.exception.ApiException;
import pl.jakub.ambulancemanagement.exception.ErrorCode;
import pl.jakub.ambulancemanagement.route_orders.model.RouteOrder;
import pl.jakub.ambulancemanagement.route_orders.repository.RouteOrderRepository;
import pl.jakub.ambulancemanagement.routes.dto.RouteCreateRequest;
import pl.jakub.ambulancemanagement.routes.dto.RouteFinishRequest;
import pl.jakub.ambulancemanagement.routes.model.Route;
import pl.jakub.ambulancemanagement.routes.model.RouteStatus;
import pl.jakub.ambulancemanagement.routes.repository.RouteRepository;
import pl.jakub.ambulancemanagement.shifts.model.Shift;
import pl.jakub.ambulancemanagement.shifts.model.ShiftStatus;
import pl.jakub.ambulancemanagement.shifts.repository.ShiftRepository;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportOrder;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportStatus;
import pl.jakub.ambulancemanagement.transport_orders.repository.TransportOrderRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RouteService {

    private final RouteRepository routeRepository;
    private final TransportOrderRepository transportOrderRepository;
    private final ShiftRepository shiftRepository;
    private final RouteOrderRepository routeOrderRepository;


    public List<Route> getAllRoutes() {
        return routeRepository.findAll();
    }

    public Route getRouteById(java.lang.Long id) {
        return routeRepository.findById(id).orElseThrow(() -> new ApiException(ErrorCode.ROUTE_NOT_FOUND));
    }

    @Transactional
    public Route createRoute(RouteCreateRequest request) {

        Shift shift = shiftRepository.findById(request.getShiftId())
                .orElseThrow(() -> new ApiException(ErrorCode.SHIFT_NOT_FOUND));

        if (shift.getStatus() != ShiftStatus.ACTIVE) {
            throw new ApiException(ErrorCode.SHIFT_NOT_ACTIVE);
        }
        Route route = new Route();
        route.setShift(shift);
        route.setStartAddress(request.getStartAddress());
        route.setActualDestinationAddress(request.getActualDestinationAddress());
        route.setNotes(request.getNotes());
        route.setStatus(RouteStatus.CREATED);

        Route savedRoute = routeRepository.save(route);

        List<RouteOrder> routeOrders = new ArrayList<>();

        for (Long transportOrderId : request.getTransportOrderIds()) {
            TransportOrder transportOrder = transportOrderRepository.findById(transportOrderId)
                    .orElseThrow(() -> new ApiException(ErrorCode.TRANSPORT_ORDER_NOT_FOUND));

            if (transportOrder.getStatus() == TransportStatus.CANCELLED ||
                    transportOrder.getStatus() == TransportStatus.COMPLETED) {
                throw new ApiException(ErrorCode.TRANSPORT_ORDER_NOT_AVAILABLE);
            }

            RouteOrder routeOrder = new RouteOrder();
            routeOrder.setRoute(savedRoute);
            routeOrder.setTransportOrder(transportOrder);

            routeOrders.add(routeOrder);
        }
        routeOrderRepository.saveAll(routeOrders);

        savedRoute.setRouteOrders(routeOrders);

        return savedRoute;
    }

    @Transactional
    public Route startRoute(Long id) {
        Route route = getRouteById(id);

        if (route.getStatus() != RouteStatus.CREATED) {
            throw new ApiException(ErrorCode.ROUTE_CANNOT_BE_STARTED);
        }

        List<RouteOrder> routeOrders = routeOrderRepository.findByRouteId(route.getId());

        if (routeOrders.isEmpty()) {
            throw new ApiException(ErrorCode.ROUTE_HAS_NO_TRANSPORT_ORDERS);
        }

        for (RouteOrder routeOrder : routeOrders) {
            TransportOrder transportOrder = routeOrder.getTransportOrder();

            if (transportOrder.getStatus() == TransportStatus.CANCELLED ||
                    transportOrder.getStatus() == TransportStatus.COMPLETED) {
                throw new ApiException(ErrorCode.TRANSPORT_ORDER_NOT_AVAILABLE);
            }

            transportOrder.setStatus(TransportStatus.IN_PROGRESS);

        }
        route.setStartedAt(LocalDateTime.now());
        route.setStatus(RouteStatus.IN_PROGRESS);

        return routeRepository.save(route);
    }

    @Transactional
    public Route markRouteAsWaiting(Long id) {
        Route route = getRouteById(id);
        if(route.getStatus() != RouteStatus.IN_PROGRESS) {
            throw new ApiException(ErrorCode.ROUTE_CANNOT_BE_MARKED_AS_WAITING);
        }

        route.setStatus(RouteStatus.WAITING);
        return routeRepository.save(route);
    }

    @Transactional
    public Route resumeRoute(Long id) {
        Route route = getRouteById(id);
        if(route.getStatus() != RouteStatus.WAITING) {
            throw new ApiException(ErrorCode.ROUTE_CANNOT_BE_RESUMED);
        }
        route.setStatus(RouteStatus.IN_PROGRESS);
        return routeRepository.save(route);
    }

    @Transactional
    public Route finishRoute(Long id, RouteFinishRequest request) {
        Route route = getRouteById(id);

        if (route.getStatus() != RouteStatus.IN_PROGRESS) {
            throw new ApiException(ErrorCode.ROUTE_CANNOT_BE_FINISHED);
        }
        List<RouteOrder> routeOrders = routeOrderRepository.findByRouteId(route.getId());

        if (routeOrders.isEmpty()) {
            throw new ApiException(ErrorCode.ROUTE_HAS_NO_TRANSPORT_ORDERS);
        }

        LocalDateTime now = LocalDateTime.now();

        for (RouteOrder routeOrder : routeOrders) {
            TransportOrder transportOrder = routeOrder.getTransportOrder();

            switch (request.getOrderAction()) {

                case KEEP_ACTIVE -> transportOrder.setStatus(TransportStatus.IN_PROGRESS);

                case WAITING_FOR_PICKUP -> transportOrder.setStatus(TransportStatus.WAITING_FOR_PICKUP);

                case COMPLETE -> {
                    transportOrder.setStatus(TransportStatus.COMPLETED);
                    transportOrder.setCompletedAt(now);
                }
            }
        }

        route.setFinishedAt(now);
        route.setStatus(RouteStatus.COMPLETED);
        route.setDistanceKm(request.getDistanceKm());

        if (request.getNotes() != null) {
            route.setNotes(normalizeNullableText(request.getNotes()));
        }


        return routeRepository.save(route);
    }

    private String normalizeNullableText(String value) {

        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
