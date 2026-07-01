package pl.jakub.ambulancemanagement.transport_orders.service;


import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pl.jakub.ambulancemanagement.auth.security.CurrentUserService;
import pl.jakub.ambulancemanagement.exception.ApiException;
import pl.jakub.ambulancemanagement.exception.ErrorCode;
import pl.jakub.ambulancemanagement.route_members.dto.RouteMemberResponse;
import pl.jakub.ambulancemanagement.route_members.repository.RouteMemberRepository;
import pl.jakub.ambulancemanagement.route_orders.repository.RouteOrderRepository;
import pl.jakub.ambulancemanagement.routes.dto.RouteSummaryResponse;
import pl.jakub.ambulancemanagement.shifts.model.ShiftStatus;
import pl.jakub.ambulancemanagement.shifts.repository.ShiftRepository;
import pl.jakub.ambulancemanagement.transport_order_patient_data.dto.TransportOrderPatientDataResponse;
import pl.jakub.ambulancemanagement.transport_order_patient_data.model.TransportOrderPatientData;
import pl.jakub.ambulancemanagement.transport_order_patient_data.repository.TransportOrderPatientDataRepository;
import pl.jakub.ambulancemanagement.transport_orders.dto.*;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportOrder;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportStatus;
import pl.jakub.ambulancemanagement.transport_orders.repository.TransportOrderRepository;
import pl.jakub.ambulancemanagement.users.model.User;
import pl.jakub.ambulancemanagement.users.model.UserRole;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class TransportOrderService {

    private final TransportOrderRepository transportOrderRepository;
    private final TransportOrderPatientDataRepository transportOrderPatientDataRepository;
    private final RouteOrderRepository routeOrderRepository;
    private final RouteMemberRepository routeMemberRepository;
    private final CurrentUserService currentUserService;
    private final ShiftRepository shiftRepository;


    public List<TransportOrder> getAllTransportOrders() {
        return transportOrderRepository.findAll();
    }

    public TransportOrder getTransportOrderById(Long id) {
        return transportOrderRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.TRANSPORT_ORDER_NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public TransportOrder getTransportOrderByIdWithAccessCheck(Long id) {
        TransportOrder transportOrder = getTransportOrderById(id);

        validateCurrentUserCanAccessTransportOrder(transportOrder);

        return transportOrder;
    }

    @Transactional(readOnly = true)
    public List<TransportOrder> getMyTransportOrders() {
        User currentUser = currentUserService.getCurrentUser();

        List<TransportOrder> createdByMe =
                transportOrderRepository.findByCreatedBy_IdOrderByCreatedAtDesc(currentUser.getId());

        List<TransportOrder> fromRoutesAsDriver =
                routeOrderRepository.findTransportOrdersByRouteDriverId(currentUser.getId());

        List<TransportOrder> fromRoutesAsRegisteredMember =
                routeOrderRepository.findTransportOrdersByRouteMemberUserId(currentUser.getId());

        return Stream.of(createdByMe, fromRoutesAsDriver, fromRoutesAsRegisteredMember)
                //Zmieniamy stream trzech list na jeden stream pojedyńczych zleceń
                .flatMap(List::stream)

                //usuwamy duplikaty po ID, bo to samo zlecenie może pojawić się w kilku źródłach
                .collect(Collectors.toMap(
                        TransportOrder::getId,
                        transportOrder -> transportOrder,

                        //jeśli są dwa zlecenia z tym samym ID--- zostawiamy pierwsze
                        (first, second) -> first))

                //wyciągam z mapy same zlecenia
                .values()
                .stream()

                //sortujemy od najnowszych do najstarszych
                .sorted(Comparator.comparing(TransportOrder::getCreatedAt).reversed())
                .toList();

    }

    @Transactional(readOnly = true)
    public List<TransportOrder> getAvailableOrdersForCrew() {
        return transportOrderRepository.findByStatusInOrderByCreatedAtAsc(
                List.of(
                        TransportStatus.WAITING_FOR_PICKUP,
                        TransportStatus.NEW
                )
        );
    }

    @Transactional
    public TransportOrder createTransportOrderByManager(CreateTransportOrderByManagerRequest request) {

        User user = currentUserService.getCurrentUser();

        String orderNumber = prepareOptionalOrderNumber(request.getOrderNumber());


        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new ApiException(ErrorCode.USER_NOT_ACTIVE);
        }

        String pickupAddress = normalizeRequiredText(request.getPickupAddress());
        String destinationAddress = normalizeRequiredText(request.getDestinationAddress());

        TransportOrder transportOrder = buildTransportOrder(request, user, orderNumber, pickupAddress, destinationAddress);

        TransportOrder savedTransportOrder = transportOrderRepository.save(transportOrder);

        createPatientDataForTransportOrder(savedTransportOrder, request.getPatients());

        return savedTransportOrder;
    }

    @Transactional
    public TransportOrder assignTransportOrderNumber(AssignOrderNumberRequest request, long id) {

        TransportOrder transportOrder = getTransportOrderById(id);


        if (transportOrder.getOrderNumber() != null) {
            throw new ApiException(ErrorCode.ORDER_NUMBER_ALREADY_ASSIGNED);
        }

        String orderNumber = prepareRequiredOrderNumber(request.getOrderNumber());

        transportOrder.setOrderNumber(orderNumber);

        return transportOrderRepository.save(transportOrder);
    }

    @Transactional
    public TransportOrder createTransportOrderByUser(CreateTransportOrderByUserRequest request) {

        User user = currentUserService.getCurrentUser();

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new ApiException(ErrorCode.USER_NOT_ACTIVE);
        }

        if(!shiftRepository.existsByDriver_IdAndStatus(user.getId(), ShiftStatus.ACTIVE)){
            throw new ApiException(ErrorCode.SHIFT_NOT_ACTIVE);
        }

        TransportOrder transportOrder = buildTransportOrderByUser(request, user);

        TransportOrder savedTransportOrder = transportOrderRepository.save(transportOrder);

        createPatientDataForTransportOrder(savedTransportOrder, request.getPatients());

       return savedTransportOrder;

    }

    @Transactional
    public TransportOrder updateTransportOrderByUser(UpdateTransportOrderByUserRequest request, long id) {

        TransportOrder transportOrderToUpdate = getTransportOrderById(id);

        validateCurrentUserCanModifyTransportOrderAsUser(transportOrderToUpdate);

        validateTransportOrderCanBeModified(transportOrderToUpdate);

        updateTransportOrderByUserFields(request, transportOrderToUpdate);

        return transportOrderRepository.save(transportOrderToUpdate);
    }

    @Transactional
    public TransportOrder updateTransportOrderByManager(UpdateTransportOrderByManagerRequest request, long id) {
        TransportOrder transportOrderToUpdate = getTransportOrderById(id);

        validateTransportOrderCanBeModified(transportOrderToUpdate);

        if (request.getOrderNumber() != null) {
            if (request.getOrderNumber().isBlank()) {
                throw new ApiException(ErrorCode.TRANSPORT_ORDER_INVALID_REQUEST);
            }

            String orderNumber = request.getOrderNumber().trim();

            boolean orderNumberChanged = !orderNumber.equals(transportOrderToUpdate.getOrderNumber());

            if (orderNumberChanged && transportOrderRepository.existsByOrderNumber(orderNumber)) {
                throw new ApiException(ErrorCode.ORDER_NUMBER_ALREADY_EXIST);
            }

            transportOrderToUpdate.setOrderNumber(orderNumber);
        }

        if (request.getPickupAddress() != null && request.getPickupAddress().isBlank()) {
            throw new ApiException(ErrorCode.TRANSPORT_ORDER_INVALID_REQUEST);
        }

        if (request.getDestinationAddress() != null && request.getDestinationAddress().isBlank()) {
            throw new ApiException(ErrorCode.TRANSPORT_ORDER_INVALID_REQUEST);
        }

        updateTransportOrderByManagerFields(request, transportOrderToUpdate);

        return transportOrderRepository.save(transportOrderToUpdate);
    }

    @Transactional
    public TransportOrder completeTransportOrderByManager(long id) {
        TransportOrder transportOrder = getTransportOrderById(id);

        if (transportOrder.getStatus() == TransportStatus.CANCELLED) {
            throw new ApiException(ErrorCode.TRANSPORT_ORDER_ALREADY_CANCELLED);
        }

        if (transportOrder.getStatus() == TransportStatus.COMPLETED) {
            throw new ApiException(ErrorCode.TRANSPORT_ORDER_ALREADY_COMPLETED);
        }

        transportOrder.setStatus(TransportStatus.COMPLETED);
        transportOrder.setCompletedAt(LocalDateTime.now());

        return transportOrderRepository.save(transportOrder);
    }

    @Transactional
    public TransportOrder cancelTransportOrder(long id, CancelTransportOrderRequest request) {
        TransportOrder transportOrder = getTransportOrderById(id);

        validateCurrentUserCanCancelTransportOrder(transportOrder);

        if (transportOrder.getStatus() == TransportStatus.COMPLETED) {
            throw new ApiException(ErrorCode.TRANSPORT_ORDER_ALREADY_COMPLETED);
        }

        if (transportOrder.getStatus() == TransportStatus.CANCELLED) {
            throw new ApiException(ErrorCode.TRANSPORT_ORDER_ALREADY_CANCELLED);
        }

        User cancelledBy = currentUserService.getCurrentUser();

        if (!Boolean.TRUE.equals(cancelledBy.getActive())) {
            throw new ApiException(ErrorCode.USER_NOT_ACTIVE);
        }

        transportOrder.setStatus(TransportStatus.CANCELLED);
        transportOrder.setCancelledAt(LocalDateTime.now());
        transportOrder.setCancelledBy(cancelledBy);
        transportOrder.setCancelReason(request.getCancelReason());
        transportOrder.setCancelDescription(normalizeNullableText(request.getCancelDescription()));

        return transportOrderRepository.save(transportOrder);
    }

    @Transactional(readOnly = true)
    public List<TransportOrder> getOrderByStatus(TransportStatus status) {
        return transportOrderRepository.findByStatusOrderByCreatedAtAsc(status);
    }

    @Transactional(readOnly = true)
    public TransportOrderCrewPreviewResponse getTransportOrderCrewPreviewById(Long id){
        TransportOrder transportOrder = getTransportOrderById(id);

        if(transportOrder.getStatus() != TransportStatus.NEW
                && transportOrder.getStatus() != TransportStatus.WAITING_FOR_PICKUP){
            throw new ApiException(ErrorCode.TRANSPORT_ORDER_INVALID_REQUEST);
        }
        List<TransportOrderPatientDataResponse> patients =
                transportOrderPatientDataRepository.findByTransportOrderId(id)
                        .stream()
                        .map(TransportOrderPatientDataResponse::fromEntity)
                        .toList();

        return TransportOrderCrewPreviewResponse.fromEntity(transportOrder,patients);
    }

    @Transactional(readOnly = true)
    public TransportOrderDetailsResponse getTransportOrderDetailsById(Long id) {
        TransportOrder transportOrder = getTransportOrderById(id);

        validateCurrentUserCanAccessTransportOrder(transportOrder);

        List<RouteSummaryResponse> routes =
                routeOrderRepository.findByTransportOrder_Id(id)
                        .stream()
                        .map(routeOrder -> {
                            var route = routeOrder.getRoute();

                            List<RouteMemberResponse> routeMembers =
                                    routeMemberRepository.findByRouteIdOrderByCreatedAtAsc(route.getId())
                                            .stream()
                                            .map(RouteMemberResponse::fromEntity)
                                            .toList();

                            return RouteSummaryResponse.fromEntity(route, routeMembers);
                        })
                        .toList();

        List<TransportOrderPatientDataResponse> patients =
                transportOrderPatientDataRepository.findByTransportOrderId(id)
                        .stream()
                        .map(TransportOrderPatientDataResponse::fromEntity)
                        .toList();

        return TransportOrderDetailsResponse.fromEntity(transportOrder, patients, routes);
    }

    private TransportOrder buildTransportOrder(CreateTransportOrderByManagerRequest request,
                                               User user, String orderNumber,
                                               String pickupAddress, String destinationAddress) {
        TransportOrder transportOrder = new TransportOrder();

        transportOrder.setOrderNumber(orderNumber);
        transportOrder.setOrderType(request.getOrderType());
        transportOrder.setSource(request.getSource());
        transportOrder.setPriority(request.getPriority());
        transportOrder.setPickupAddress(pickupAddress);
        transportOrder.setDestinationAddress(destinationAddress);
        transportOrder.setDescription(normalizeNullableText(request.getDescription()));
        transportOrder.setCreatedBy(user);
        transportOrder.setStatus(TransportStatus.NEW);
        return transportOrder;
    }

    private TransportOrder buildTransportOrderByUser(CreateTransportOrderByUserRequest request, User user) {
        TransportOrder transportOrder = new TransportOrder();

        String pickupAddress = normalizeRequiredText(request.getPickupAddress());
        String destinationAddress = normalizeRequiredText(request.getDestinationAddress());

        transportOrder.setOrderType(request.getOrderType());
        transportOrder.setSource(request.getSource());
        transportOrder.setPriority(request.getPriority());
        transportOrder.setPickupAddress(pickupAddress);
        transportOrder.setDestinationAddress(destinationAddress);
        transportOrder.setDescription(normalizeNullableText(request.getDescription()));
        transportOrder.setCreatedBy(user);
        transportOrder.setStatus(TransportStatus.NEW);
        return transportOrder;
    }

    private String prepareOptionalOrderNumber(String requestOrderNumber) {
        if (requestOrderNumber == null || requestOrderNumber.isBlank()) {
            return null;
        }

        String orderNumber = requestOrderNumber.trim();

        if (transportOrderRepository.existsByOrderNumber(orderNumber)) {
            throw new ApiException(ErrorCode.ORDER_NUMBER_ALREADY_EXIST);
        }

        return orderNumber;
    }

    private void updateTransportOrderByManagerFields(UpdateTransportOrderByManagerRequest request,
                                                     TransportOrder transportOrderToUpdate) {
        if (request.getOrderType() != null) {
            transportOrderToUpdate.setOrderType(request.getOrderType());
        }

        if (request.getSource() != null) {
            transportOrderToUpdate.setSource(request.getSource());
        }

        if (request.getPriority() != null) {
            transportOrderToUpdate.setPriority(request.getPriority());
        }

        if (request.getDescription() != null) {
            transportOrderToUpdate.setDescription(normalizeNullableText(request.getDescription()));
        }
        if (request.getPickupAddress() != null) {
            transportOrderToUpdate.setPickupAddress(request.getPickupAddress().trim());
        }
        if (request.getDestinationAddress() != null) {
            transportOrderToUpdate.setDestinationAddress(request.getDestinationAddress().trim());
        }
    }

    private void updateTransportOrderByUserFields(UpdateTransportOrderByUserRequest request,
                                                  TransportOrder transportOrderToUpdate) {
        if (request.getOrderType() != null) {
            transportOrderToUpdate.setOrderType(request.getOrderType());
        }

        if (request.getSource() != null) {
            transportOrderToUpdate.setSource(request.getSource());
        }

        if (request.getPriority() != null) {
            transportOrderToUpdate.setPriority(request.getPriority());
        }

        if (request.getDescription() != null) {
            transportOrderToUpdate.setDescription(normalizeNullableText(request.getDescription()));
        }

    }

    private String prepareRequiredOrderNumber(String requestOrderNumber) {
        if (requestOrderNumber == null || requestOrderNumber.isBlank()) {
            throw new ApiException(ErrorCode.TRANSPORT_ORDER_INVALID_REQUEST);
        }

        String orderNumber = requestOrderNumber.trim();

        if (transportOrderRepository.existsByOrderNumber(orderNumber)) {
            throw new ApiException(ErrorCode.ORDER_NUMBER_ALREADY_EXIST);
        }

        return orderNumber;
    }

    private void validateTransportOrderCanBeModified(TransportOrder transportOrder) {
        if (transportOrder.getStatus() == TransportStatus.CANCELLED) {
            throw new ApiException(ErrorCode.TRANSPORT_ORDER_ALREADY_CANCELLED);
        }

        if (transportOrder.getStatus() == TransportStatus.COMPLETED) {
            throw new ApiException(ErrorCode.TRANSPORT_ORDER_ALREADY_COMPLETED);
        }
    }

    private String normalizeRequiredText(String value) {
        if (value == null || value.isBlank()) {
            throw new ApiException(ErrorCode.TRANSPORT_ORDER_INVALID_REQUEST);
        }

        return value.trim();
    }
    private String normalizeNullableText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
    private void createPatientDataForTransportOrder(
            TransportOrder transportOrder,
            List<TransportOrderPatientCreateItemRequest> patients
    ) {
        if (patients == null || patients.isEmpty()) {
            return;
        }

        List<TransportOrderPatientData> patientDataList = patients.stream()
                .map(patientRequest -> {
                    TransportOrderPatientData patientData = new TransportOrderPatientData();

                    patientData.setTransportOrder(transportOrder);
                    patientData.setPatientFirstName(normalizeRequiredText(patientRequest.getPatientFirstName()));
                    patientData.setPatientLastName(normalizeRequiredText(patientRequest.getPatientLastName()));
                    patientData.setPickupDetails(normalizeNullableText(patientRequest.getPickupDetails()));

                    return patientData;
                })
                .toList();

        transportOrderPatientDataRepository.saveAll(patientDataList);
    }

    private void validateCurrentUserCanAccessTransportOrder(TransportOrder transportOrder) {
        User currentUser = currentUserService.getCurrentUser();

        if(isAdminOrManager(currentUser)) {
            return;
        }

        if(transportOrder.getCreatedBy() != null
                && transportOrder.getCreatedBy().getId().equals(currentUser.getId())) {
            return;
        }

        boolean userIsRelatedToRouteWithThisOrder = routeOrderRepository.findByTransportOrder_Id(transportOrder.getId())
                .stream()
                .anyMatch(routeOrder -> {
                    Long routeId = routeOrder.getRoute().getId();

                    boolean isRouteDriver = routeOrder.getRoute()
                            .getShift()
                            .getDriver()
                            .getId()
                            .equals(currentUser.getId());

                    boolean isRouteMember = routeMemberRepository.existsByRouteIdAndUserId(
                            routeId,
                            currentUser.getId()
                    );

                    return isRouteDriver || isRouteMember;
                });

        if(userIsRelatedToRouteWithThisOrder) {
            return;
        }
        throw new ApiException(ErrorCode.TRANSPORT_ORDER_ACCESS_DENIED);
    }

    private boolean isAdminOrManager(User user) {
        return user.getUserRole() == UserRole.ADMIN
                || user.getUserRole() == UserRole.MANAGER;
    }

    private void validateCurrentUserCanModifyTransportOrderAsUser(TransportOrder transportOrder) {
        User currentUser = currentUserService.getCurrentUser();

        if (transportOrder.getCreatedBy() != null
                && transportOrder.getCreatedBy().getId().equals(currentUser.getId())) {
            return;
        }

        throw new ApiException(ErrorCode.TRANSPORT_ORDER_ACCESS_DENIED);
    }
    private void validateCurrentUserCanCancelTransportOrder(TransportOrder transportOrder) {
        validateCurrentUserCanAccessTransportOrder(transportOrder);
    }
}