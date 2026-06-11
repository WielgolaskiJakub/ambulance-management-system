package pl.jakub.ambulancemanagement.transport_orders.model;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import pl.jakub.ambulancemanagement.users.model.User;

import java.time.LocalDateTime;

@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "transport_orders")
public class TransportOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", length = 100)
    private String orderNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransportOrderType orderType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransportSource source;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransportStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransportPriority priority;

    @Column(name = "pickup_address")
    private String pickupAddress;

    @Column(name = "destination_address")
    private String destinationAddress;

    @Column(name = "description")
    private String description;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cancelled_by_id")
    private User cancelledBy;

    @Enumerated(EnumType.STRING)
    private TransportCancelReason cancelReason;

    @Column(name = "cancel_description")
    private String cancelDescription;

    @Column(name = "anonymized_at")
    private LocalDateTime anonymizedAt;
}
