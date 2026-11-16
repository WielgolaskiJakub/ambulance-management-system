package pl.jakub.ambulancemanagement.transport_orders.dto;

import pl.jakub.ambulancemanagement.routes.dto.RouteSummaryResponse;
import pl.jakub.ambulancemanagement.transport_order_patient_data.dto.TransportOrderPatientDataResponse;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportCancelReason;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportOrder;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportOrderType;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportPriority;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportSource;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportStatus;
import pl.jakub.ambulancemanagement.users.model.User;
import pl.jakub.ambulancemanagement.users.model.UserRole;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public record TransportOrderDetailsResponse(
        Long id,
        String orderNumber,
        LocalDate plannedDate,
        LocalTime plannedDepartureTime,
        TransportOrderType orderType,
        TransportSource source,
        TransportPriority priority,
        TransportStatus status,

        Long createdById,
        String createdByFullName,
        UserRole createdByRole,

        String pickupAddress,
        String destinationAddress,
        String description,

        LocalDateTime createdAt,
        LocalDateTime completedAt,
        LocalDateTime cancelledAt,

        Long cancelledById,
        String cancelledByFullName,
        TransportCancelReason cancelReason,
        String cancelDescription,

        List<TransportOrderPatientDataResponse> patients,
        List<RouteSummaryResponse> routes
) {
    public static TransportOrderDetailsResponse fromEntity(
            TransportOrder transportOrder,
            List<TransportOrderPatientDataResponse> patients,
            List<RouteSummaryResponse> routes
    ) {
        User createdBy = transportOrder.getCreatedBy();
        User cancelledBy = transportOrder.getCancelledBy();

        return new TransportOrderDetailsResponse(
                transportOrder.getId(),
                transportOrder.getOrderNumber(),
                transportOrder.getPlannedDate(),
                transportOrder.getPlannedDepartureTime(),
                transportOrder.getOrderType(),
                transportOrder.getSource(),
                transportOrder.getPriority(),
                transportOrder.getStatus(),

                createdBy.getId(),
                getUserFullName(createdBy),
                createdBy.getUserRole(),

                transportOrder.getPickupAddress(),
                transportOrder.getDestinationAddress(),
                transportOrder.getDescription(),

                transportOrder.getCreatedAt(),
                transportOrder.getCompletedAt(),
                transportOrder.getCancelledAt(),

                cancelledBy != null ? cancelledBy.getId() : null,
                cancelledBy != null ? getUserFullName(cancelledBy) : null,
                transportOrder.getCancelReason(),
                transportOrder.getCancelDescription(),

                patients,
                routes
        );
    }

    private static String getUserFullName(User user) {
        return user.getFirstName() + " " + user.getLastName();
    }
}