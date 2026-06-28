package pl.jakub.ambulancemanagement.route_members.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import pl.jakub.ambulancemanagement.routes.model.Route;
import pl.jakub.ambulancemanagement.users.model.User;

import java.time.LocalDateTime;


@Getter
@Setter
@Entity
@NoArgsConstructor
@Table(name = "route_members")
public class RouteMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id", nullable = false)
    private Route route;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "member_name")
    private String memberName;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private RouteMemberRole role;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false)
    private RouteMemberSource source;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
