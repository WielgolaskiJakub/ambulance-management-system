package pl.jakub.ambulancemanagement.transport_orders.service;


import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pl.jakub.ambulancemanagement.exception.ApiException;
import pl.jakub.ambulancemanagement.exception.ErrorCode;
import pl.jakub.ambulancemanagement.route_members.dto.RouteMemberResponse;
import pl.jakub.ambulancemanagement.route_members.repository.RouteMemberRepository;
import pl.jakub.ambulancemanagement.route_orders.repository.RouteOrderRepository;
import pl.jakub.ambulancemanagement.routes.dto.RouteSummaryResponse;
import pl.jakub.ambulancemanagement.transport_order_patient_data.dto.TransportOrderPatientDataResponse;
import pl.jakub.ambulancemanagement.transport_order_patient_data.model.TransportOrderPatientData;
import pl.jakub.ambulancemanagement.transport_order_patient_data.repository.TransportOrderPatientDataRepository;
import pl.jakub.ambulancemanagement.transport_orders.dto.*;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportOrder;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportStatus;
import pl.jakub.ambulancemanagement.transport_orders.repository.TransportOrderRepository;
import pl.jakub.ambulancemanagement.users.model.User;
import pl.jakub.ambulancemanagement.users.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransportOrderService {

    private final TransportOrderRepository transportOrderRepository;
    private final UserRepository userRepository;
    private final TransportOrderPatientDataRepository transportOrderPatientDataRepository;
    private final RouteOrderRepository routeOrderRepository;
    private final RouteMemberRepository routeMemberRepository;

    public List<TransportOrder> getAllTransportOrders() {
        return transportOrderRepository.findAll();
    }

    public TransportOrder getTransportOrderById(Long id) {
        return transportOrderRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.TRANSPORT_ORDER_NOT_FOUND));
    }

    @Transactional
    public TransportOrder createTransportOrderByManager(CreateTransportOrderByManagerRequest request) {

        User user = userRepository.findById(request.getCreatedById())
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

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

    public TransportOrder assignTransportOrderNumber(AssignOrderNumberRequest request, long id) {

        TransportOrder transportOrder = getTransportOrderById(id);


        if (transportOrder.getOrderNumber() != null) {
            throw new ApiException(ErrorCode.ORDER_NUMBER_ALREADY_ASSIGNED);
        }

        String orderNumber = prepareRequiredOrderNumber(request.getOrderNumber());

        transportOrder.setOrderNumber(orderNumber);

        return transportOrderRepository.save(transportOrder);
    }

    public TransportOrder createTransportOrderByUser(CreateTransportOrderByUserRequest request) {

        User user = userRepository.findById(request.getCreatedById())
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new ApiException(ErrorCode.USER_NOT_ACTIVE);
        }

        TransportOrder transportOrder = buildTransportOrderByUser(request, user);


        return transportOrderRepository.save(transportOrder);

    }

    public TransportOrder updateTransportOrderByUser(UpdateTransportOrderByUserRequest request, long id) {

        TransportOrder transportOrderToUpdate = getTransportOrderById(id);

        validateTransportOrderCanBeModified(transportOrderToUpdate);

        updateTransportOrderByUserFields(request, transportOrderToUpdate);

        return transportOrderRepository.save(transportOrderToUpdate);
    }

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

        if (transportOrder.getStatus() == TransportStatus.COMPLETED) {
            throw new ApiException(ErrorCode.TRANSPORT_ORDER_ALREADY_COMPLETED);
        }

        if (transportOrder.getStatus() == TransportStatus.CANCELLED) {
            throw new ApiException(ErrorCode.TRANSPORT_ORDER_ALREADY_CANCELLED);
        }

        User cancelledBy = userRepository.findById(request.getCancelledById())
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

        if (!Boolean.TRUE.equals(cancelledBy.getActive())) {
            throw new ApiException(ErrorCode.USER_NOT_ACTIVE);
        }

        transportOrder.setStatus(TransportStatus.CANCELLED);
        transportOrder.setCancelledAt(LocalDateTime.now());
        transportOrder.setCancelledBy(cancelledBy);
        transportOrder.setCancelReason(request.getCancelReason());
        transportOrder.setCancelDescription(request.getCancelDescription());

        return transportOrderRepository.save(transportOrder);
    }

    public List<TransportOrder> getOrderByStatus(TransportStatus status) {
        return transportOrderRepository.findByStatusOrderByCreatedAtAsc(status);
    }

    public TransportOrderDetailsResponse getTransportOrderDetailsById(Long id) {
        TransportOrder transportOrder = getTransportOrderById(id);

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

        transportOrder.setOrderType(request.getOrderType());
        transportOrder.setSource(request.getSource());
        transportOrder.setPriority(request.getPriority());
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
            transportOrderToUpdate.setDescription(request.getDescription());
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
}