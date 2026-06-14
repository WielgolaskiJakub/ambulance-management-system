package pl.jakub.ambulancemanagement.routes.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import pl.jakub.ambulancemanagement.route_orders.model.RouteOrder;
import pl.jakub.ambulancemanagement.shifts.model.Shift;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "routes")
public class Route {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shift_id", nullable = false)
    private Shift shift;

    @Column(name = "start_address", nullable = false, length = 255)
    private String startAddress;

    @Column(name = "actual_destination_address", nullable = false, length = 255)
    private String actualDestinationAddress;

    @PositiveOrZero
    @Column(name = "distance_km")
    private Integer distanceKm;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(name = "notes")
    private String notes;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private RouteStatus status;

    @Column(name = "start_odometer_km")
    private Integer startOdometerKm;

    @Column(name = "finish_odometer_km")
    private Integer finishOdometerKm;

    @CreationTimestamp
    @Column(name = "created_at",  nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "route")
    private List<RouteOrder> routeOrders;
}
