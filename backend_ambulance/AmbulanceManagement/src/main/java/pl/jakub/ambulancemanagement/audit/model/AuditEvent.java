package pl.jakub.ambulancemanagement.audit.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import pl.jakub.ambulancemanagement.users.model.User;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "audit_events")
public class AuditEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "actor_id", nullable = false, updatable = false)
    private User actor;


    @Column(name = "actor_username", nullable = false, updatable = false, length = 255)
    private String actorUsername;

    @Column(name = "occurred_at", nullable = false, updatable = false)
    private Instant occurredAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, updatable = false, length = 100)
    private AuditAction action;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false, updatable = false, length = 50)
    private AuditEntityType entityType;

    @Column(name = "entity_id", nullable = false, updatable = false)
    private Long entityId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "details", nullable = false, updatable = false, columnDefinition = "jsonb")
    private Map<String, Object> details = new HashMap<>();

    @Column(name = "reason", updatable = false, columnDefinition = "text")
    private String reason;
}
