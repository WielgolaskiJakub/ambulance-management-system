package pl.jakub.ambulancemanagement.audit.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import pl.jakub.ambulancemanagement.audit.model.AuditAction;
import pl.jakub.ambulancemanagement.audit.model.AuditEntityType;
import pl.jakub.ambulancemanagement.audit.model.AuditEvent;
import pl.jakub.ambulancemanagement.audit.repository.AuditEventRepository;
import pl.jakub.ambulancemanagement.auth.security.CurrentUserService;
import pl.jakub.ambulancemanagement.users.model.User;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditEventRepository auditEventRepository;
    private final CurrentUserService currentUserService;

    @Transactional(propagation = Propagation.MANDATORY)
    public void record(
            AuditAction action,
            AuditEntityType entityType,
            Long entityId,
            Map<String, Object> details,
            String reason
    ){
        User actor = currentUserService.getCurrentUser();

        AuditEvent event = new AuditEvent();
        event.setActor(actor);
        event.setActorUsername(actor.getUsername());
        event.setOccurredAt(Instant.now());
        event.setAction(action);
        event.setEntityType(entityType);
        event.setEntityId(entityId);
        event.setDetails(details == null ? new HashMap<>() : new HashMap<>(details));
        event.setReason(reason);

        auditEventRepository.save(event);
    }
}
