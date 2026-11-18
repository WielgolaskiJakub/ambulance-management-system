package pl.jakub.ambulancemanagement.audit.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.jakub.ambulancemanagement.audit.model.AuditEvent;

public interface AuditEventRepository extends JpaRepository<AuditEvent, Long> {
}
