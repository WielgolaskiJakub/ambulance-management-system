package pl.jakub.ambulancemanagement.transport_orders.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pl.jakub.ambulancemanagement.transport_order_patient_data.dto.TransportOrderPatientDataResponse;
import pl.jakub.ambulancemanagement.transport_order_patient_data.model.TransportOrderPatientData;
import pl.jakub.ambulancemanagement.transport_order_patient_data.service.TransportOrderPatientDataService;
import pl.jakub.ambulancemanagement.transport_orders.dto.*;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportOrder;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportStatus;
import pl.jakub.ambulancemanagement.transport_orders.service.TransportOrderService;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/transport-orders")
public class TransportOrderController {

    private final TransportOrderService transportOrderService;
    private final TransportOrderPatientDataService transportOrderPatientDataService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public List<TransportOrderResponse> getAllTransportOrders() {
        return transportOrderService.getAllTransportOrders()
                .stream()
                .map(TransportOrderResponse::fromEntity)
                .toList();
    }

    @GetMapping("/queue")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public List<TransportOrderResponse> getTransportOrdersByStatus(@RequestParam TransportStatus status) {
        return transportOrderService.getOrderByStatus(status)
                .stream()
                .map(TransportOrderResponse::fromEntity)
                .toList();
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('DRIVER', 'SANITARY')")
    public List<TransportOrderResponse> getMyTransportOrders() {
        return transportOrderService.getMyTransportOrders()
                .stream()
                .map(TransportOrderResponse::fromEntity)
                .toList();
    }

    @GetMapping("/queue/new")
    @PreAuthorize("hasAnyRole('DRIVER', 'SANITARY')")
    public List<TransportOrderResponse> getNewTransportOrdersForCrew() {
        return transportOrderService.getOrderByStatus(TransportStatus.NEW)
                .stream()
                .map(TransportOrderResponse::fromEntity)
                .toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DRIVER', 'SANITARY')")
    public TransportOrderResponse getTransportOrderById(@PathVariable Long id) {
        TransportOrder transportOrder = transportOrderService.getTransportOrderByIdWithAccessCheck(id);
        return TransportOrderResponse.fromEntity(transportOrder);
    }

    @GetMapping("/{id}/details")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DRIVER', 'SANITARY')")
    public TransportOrderDetailsResponse getTransportOrderDetailsById(@PathVariable Long id) {
        return transportOrderService.getTransportOrderDetailsById(id);
    }

    @PostMapping("/manager")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @ResponseStatus(HttpStatus.CREATED)
    public TransportOrderResponse createTransportOrderByManager(
            @Valid @RequestBody CreateTransportOrderByManagerRequest request
    ) {
        TransportOrder newTransportOrder = transportOrderService.createTransportOrderByManager(request);
        return TransportOrderResponse.fromEntity(newTransportOrder);
    }

    @PostMapping("/user")
    @PreAuthorize("hasAnyRole('DRIVER', 'SANITARY')")
    @ResponseStatus(HttpStatus.CREATED)
    public TransportOrderResponse createTransportOrderByUser(
            @Valid @RequestBody CreateTransportOrderByUserRequest request
    ) {
        TransportOrder newTransportOrder = transportOrderService.createTransportOrderByUser(request);
        return TransportOrderResponse.fromEntity(newTransportOrder);
    }

    @PatchMapping("/{id}/assign-order-number")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public TransportOrderResponse assignTransportOrderNumber(
            @PathVariable long id,
            @Valid @RequestBody AssignOrderNumberRequest request
    ) {
        TransportOrder transportOrder = transportOrderService.assignTransportOrderNumber(request, id);
        return TransportOrderResponse.fromEntity(transportOrder);
    }

    @PatchMapping("/{id}/manager")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public TransportOrderResponse updateTransportOrderByManager(
            @PathVariable long id,
            @Valid @RequestBody UpdateTransportOrderByManagerRequest request
    ) {
        TransportOrder updatedTransportOrder = transportOrderService.updateTransportOrderByManager(request, id);
        return TransportOrderResponse.fromEntity(updatedTransportOrder);
    }

    @PatchMapping("/{id}/user")
    @PreAuthorize("hasAnyRole('DRIVER', 'SANITARY')")
    public TransportOrderResponse updateTransportOrderByUser(
            @PathVariable long id,
            @Valid @RequestBody UpdateTransportOrderByUserRequest request
    ) {
        TransportOrder updatedTransportOrder = transportOrderService.updateTransportOrderByUser(request, id);
        return TransportOrderResponse.fromEntity(updatedTransportOrder);
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public TransportOrderResponse completeTransportOrder(@PathVariable long id) {
        TransportOrder transportOrder = transportOrderService.completeTransportOrderByManager(id);
        return TransportOrderResponse.fromEntity(transportOrder);
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DRIVER', 'SANITARY')")
    public TransportOrderResponse cancelTransportOrder(
            @PathVariable long id,
            @Valid @RequestBody CancelTransportOrderRequest request
    ) {
        TransportOrder transportOrder = transportOrderService.cancelTransportOrder(id, request);
        return TransportOrderResponse.fromEntity(transportOrder);
    }

    @GetMapping("/{transportOrderId}/patients")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DRIVER', 'SANITARY')")
    public List<TransportOrderPatientDataResponse> getPatientsByTransportOrderId(
            @PathVariable Long transportOrderId
    ) {
        return transportOrderPatientDataService.getPatientsByTransportOrderId(transportOrderId)
                .stream()
                .map(TransportOrderPatientDataResponse::fromEntity)
                .toList();
    }

    @PostMapping("/{transportOrderId}/patients")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DRIVER', 'SANITARY')")
    @ResponseStatus(HttpStatus.CREATED)
    public TransportOrderPatientDataResponse addPatientToTransportOrder(
            @PathVariable Long transportOrderId,
            @Valid @RequestBody TransportOrderPatientCreateItemRequest request
    ) {
        TransportOrderPatientData patientData =
                transportOrderPatientDataService.addPatientToTransportOrder(transportOrderId, request);

        return TransportOrderPatientDataResponse.fromEntity(patientData);
    }

    @PatchMapping("/{id}/patients/anonymize")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public List<TransportOrderPatientDataResponse> anonymizePatientsByTransportOrderId(
            @PathVariable Long id
    ) {
        return transportOrderPatientDataService.anonymizePatientsByTransportOrderId(id)
                .stream()
                .map(TransportOrderPatientDataResponse::fromEntity)
                .toList();
    }
}