package pl.jakub.ambulancemanagement.transport_orders.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import pl.jakub.ambulancemanagement.transport_orders.model.*;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportOrder;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class TransportOrderResponse {

    private java.lang.Long id;
    private String orderNumber;
    private TransportOrderType orderType;
    private TransportSource source;
    private java.lang.Long createdById;
    private TransportStatus status;
    private TransportPriority priority;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    private LocalDateTime cancelledAt;
    private java.lang.Long cancelledById;
    private TransportCancelReason cancelReason;
    private String cancelDescription;
    private LocalDateTime anonymizedAt;

    public static TransportOrderResponse fromEntity(TransportOrder order) {
        return new TransportOrderResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getOrderType(),
                order.getSource(),
                order.getCreatedBy().getId(),
                order.getStatus(),
                order.getPriority(),
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