package pl.jakub.ambulancemanagement.recovery.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pl.jakub.ambulancemanagement.recovery.dto.RestoreAmbulanceStateRequest;
import pl.jakub.ambulancemanagement.recovery.service.RecoveryService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/recovery")
public class RecoveryController {

    private final RecoveryService recoveryService;

    @PatchMapping("/ambulances/{id}/state")
    @PreAuthorize("@recoveryAccessService.canRestoreOperations()")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void restoreAmbulanceState(
            @PathVariable Long id,
            @Valid @RequestBody RestoreAmbulanceStateRequest request) {
        recoveryService.restoreAmbulanceState(request, id);
    }
}
