package pl.jakub.ambulancemanagement.transport_orders.dto;

import pl.jakub.ambulancemanagement.transport_order_patient_data.dto.TransportOrderPatientDataResponse;
import pl.jakub.ambulancemanagement.transport_orders.model.*;
import pl.jakub.ambulancemanagement.users.model.User;
import pl.jakub.ambulancemanagement.users.model.UserRole;

import java.time.LocalDateTime;
import java.util.List;

public record TransportOrderCrewPreviewResponse(
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
        Long createdById,
        String createdByFullName,
        UserRole createdByRole,
        List<TransportOrderPatientDataResponse> patients
){
public static TransportOrderCrewPreviewResponse fromEntity(TransportOrder transportOrder,
        List<TransportOrderPatientDataResponse> patients){
    User createdBy = transportOrder.getCreatedBy();

    return new  TransportOrderCrewPreviewResponse(
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
            createdBy.getId(),
            createdBy.getFirstName() + " " + createdBy.getLastName(),
            createdBy.getUserRole(),
            patients

    );
}


}