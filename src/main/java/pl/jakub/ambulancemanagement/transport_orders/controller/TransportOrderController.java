package pl.jakub.ambulancemanagement.transport_orders.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pl.jakub.ambulancemanagement.transport_order_patient_data.dto.TransportOrderPatientDataResponse;
import pl.jakub.ambulancemanagement.transport_order_patient_data.service.TransportOrderPatientDataService;
import pl.jakub.ambulancemanagement.transport_orders.dto.*;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportOrder;
import pl.jakub.ambulancemanagement.transport_orders.service.TransportOrderService;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/transport-orders")
public class TransportOrderController {

    private final TransportOrderService transportOrderService;
    private final TransportOrderPatientDataService transportOrderPatientDataService;

    @GetMapping
    public List<TransportOrderResponse> getAllTransportOrders() {
        return transportOrderService.getAllTransportOrders().stream().map(TransportOrderResponse::fromEntity).toList();
    }

    @GetMapping("/{id}")
    public TransportOrderResponse getTransportOrderById(@PathVariable Long id) {
        TransportOrder transportOrder = transportOrderService.getTransportOrderById(id);
        return TransportOrderResponse.fromEntity(transportOrder);
    }

    @GetMapping("/{id}/details")
    public TransportOrderDetailsResponse getTransportOrderDetailsById(@PathVariable Long id) {
        return transportOrderService.getTransportOrderDetailsById(id);
    }

    @GetMapping("/{transportOrderId}/patients")
    public List<TransportOrderPatientDataResponse> getPatientsByTransportOrderId(
            @PathVariable Long transportOrderId
    ) {
        return transportOrderPatientDataService.getPatientsByTransportOrderId(transportOrderId)
                .stream()
                .map(TransportOrderPatientDataResponse::fromEntity)
                .toList();
    }

    @PatchMapping("/{id}/patients/anonymize")
    public List<TransportOrderPatientDataResponse> anonymizePatientsByTransportOrderId(
            @PathVariable Long id
    ) {
        return transportOrderPatientDataService.anonymizePatientsByTransportOrderId(id)
                .stream()
                .map(TransportOrderPatientDataResponse::fromEntity)
                .toList();
    }

    @PostMapping("/manager")
    @ResponseStatus(HttpStatus.CREATED)
    public TransportOrderResponse createTransportOrderByManager(
            @Valid @RequestBody CreateTransportOrderByManagerRequest request) {
        TransportOrder newTransportOrder = transportOrderService.createTransportOrderByManager(request);
        return TransportOrderResponse.fromEntity(newTransportOrder);
    }

    @PostMapping("/user")
    @ResponseStatus(HttpStatus.CREATED)
    public TransportOrderResponse createTransportOrderByUser(
            @Valid @RequestBody CreateTransportOrderByUserRequest request) {
        TransportOrder newTransportOrder = transportOrderService.createTransportOrderByUser(request);
        return TransportOrderResponse.fromEntity(newTransportOrder);
    }

    @PatchMapping("/{id}/assign-order-number")
    public TransportOrderResponse assignTransportOrderNumber(
            @Valid @RequestBody AssignOrderNumberRequest request,
            @PathVariable long id) {
        TransportOrder newTransportOrder = transportOrderService.assignTransportOrderNumber(request, id);
        return TransportOrderResponse.fromEntity(newTransportOrder);
    }

    @PatchMapping("/{id}/manager")
    public TransportOrderResponse updateTransportOrderByManager(
            @Valid @RequestBody UpdateTransportOrderByManagerRequest request,
            @PathVariable long id) {
        TransportOrder updatedTransportOrder = transportOrderService.updateTransportOrderByManager(request, id);
        return TransportOrderResponse.fromEntity(updatedTransportOrder);
    }

    @PatchMapping("/{id}/user")
    public TransportOrderResponse updateTransportOrderByUser(
            @Valid @RequestBody UpdateTransportOrderByUserRequest request,
            @PathVariable long id) {
        TransportOrder updatedTransportOrder = transportOrderService.updateTransportOrderByUser(request, id);
        return TransportOrderResponse.fromEntity(updatedTransportOrder);
    }

    @PatchMapping("/{id}/complete")
    public TransportOrderResponse completeTransportOrder(@PathVariable long id) {
        TransportOrder transportOrder = transportOrderService.completeTransportOrderByMenager(id);
        return TransportOrderResponse.fromEntity(transportOrder);
    }

    @PatchMapping("/{id}/cancel")
    public TransportOrderResponse cancelTransportOrder(
            @PathVariable long id,
            @Valid @RequestBody CancelTransportOrderRequest request
    ) {
        TransportOrder transportOrder = transportOrderService.cancelTransportOrder(id, request);
        return TransportOrderResponse.fromEntity(transportOrder);
    }
}
