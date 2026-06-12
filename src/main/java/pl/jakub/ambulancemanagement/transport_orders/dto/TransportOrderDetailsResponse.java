package pl.jakub.ambulancemanagement.transport_orders.dto;

import pl.jakub.ambulancemanagement.routes.dto.RouteSummaryResponse;
import pl.jakub.ambulancemanagement.transport_order_patient_data.dto.TransportOrderPatientDataResponse;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportOrder;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportPriority;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportSource;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportStatus;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportOrderType;

import java.time.LocalDateTime;
import java.util.List;

public record TransportOrderDetailsResponse(
        Long id,
        String orderNumber,
        TransportOrderType orderType,
        TransportSource source,
        TransportPriority priority,
        TransportStatus status,
        String pickupAddress,
        String destinationAddress,
        String description,
        LocalDateTime createdAt,
        LocalDateTime completedAt,
        LocalDateTime cancelledAt,
        List<TransportOrderPatientDataResponse> patients,
        List<RouteSummaryResponse> routes
) {
    public static TransportOrderDetailsResponse fromEntity(
            TransportOrder transportOrder,
            List<TransportOrderPatientDataResponse> patients,
            List<RouteSummaryResponse> routes
    ) {
        return new TransportOrderDetailsResponse(
                transportOrder.getId(),
                transportOrder.getOrderNumber(),
                transportOrder.getOrderType(),
                transportOrder.getSource(),
                transportOrder.getPriority(),
                transportOrder.getStatus(),
                transportOrder.getPickupAddress(),
                transportOrder.getDestinationAddress(),
                transportOrder.getDescription(),
                transportOrder.getCreatedAt(),
                transportOrder.getCompletedAt(),
                transportOrder.getCancelledAt(),
                patients,
                routes
        );
    }
}