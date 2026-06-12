package pl.jakub.ambulancemanagement.routes.dto;

import pl.jakub.ambulancemanagement.transport_order_patient_data.dto.TransportOrderPatientDataResponse;
import pl.jakub.ambulancemanagement.transport_orders.model.*;

import java.util.List;

public record RouteTransportOrderSummaryResponse(
        Long id,
        String orderNumber,
        TransportOrderType type,
        TransportSource source,
        TransportPriority priority,
        TransportStatus status,
        String pickupAddress,
        String destinationAddress,
        String description,
        List<TransportOrderPatientDataResponse> patients
) {
    public static RouteTransportOrderSummaryResponse fromEntity(
            TransportOrder order,
            List<TransportOrderPatientDataResponse> patients) {
        return new RouteTransportOrderSummaryResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getOrderType(),
                order.getSource(),
                order.getPriority(),
                order.getStatus(),
                order.getPickupAddress(),
                order.getDestinationAddress(),
                order.getDescription(),
                patients
        );
    }
}
