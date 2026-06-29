package pl.jakub.ambulancemanagement.transport_orders.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import pl.jakub.ambulancemanagement.transport_orders.model.*;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportOrder;
import pl.jakub.ambulancemanagement.users.model.UserRole;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class TransportOrderResponse {

    private Long id;
    private String orderNumber;
    private TransportOrderType orderType;
    private TransportSource source;
    private Long createdById;
    private String createdByFullName;
    private UserRole createdByRole;
    private TransportStatus status;
    private TransportPriority priority;
    private String pickupAddress;
    private String destinationAddress;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    private LocalDateTime cancelledAt;
    private Long cancelledById;
    private TransportCancelReason cancelReason;
    private String cancelDescription;
    private LocalDateTime anonymizedAt;

    public static TransportOrderResponse fromEntity(TransportOrder order) {
       String createdByFullName = order.getCreatedBy().getFirstName()
               + " "
               + order.getCreatedBy().getLastName();

        return new TransportOrderResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getOrderType(),
                order.getSource(),
                order.getCreatedBy().getId(),
                createdByFullName,
                order.getCreatedBy().getUserRole(),
                order.getStatus(),
                order.getPriority(),
                order.getPickupAddress(),
                order.getDestinationAddress(),
                order.getDescription(),
                order.getCreatedAt(),
                order.getCompletedAt(),
                order.getCancelledAt(),
                order.getCancelledBy() != null ? order.getCancelledBy().getId() : null,
                order.getCancelReason(),
                order.getCancelDescription(),
                order.getAnonymizedAt()
        );
    }
}