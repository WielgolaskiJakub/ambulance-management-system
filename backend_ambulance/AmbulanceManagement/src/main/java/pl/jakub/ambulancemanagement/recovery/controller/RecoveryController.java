package pl.jakub.ambulancemanagement.recovery.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pl.jakub.ambulancemanagement.recovery.dto.FinishRouteAfterOutageRequest;
import pl.jakub.ambulancemanagement.recovery.dto.RecoveryRouteSummaryResponse;
import pl.jakub.ambulancemanagement.recovery.dto.RestoreAmbulanceStateRequest;
import pl.jakub.ambulancemanagement.recovery.service.RecoveryAccessService;
import pl.jakub.ambulancemanagement.recovery.service.RecoveryService;
import pl.jakub.ambulancemanagement.routes.dto.RouteResponse;
import pl.jakub.ambulancemanagement.routes.service.RouteService;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/recovery")
public class RecoveryController {

    private final RecoveryService recoveryService;
    private final RouteService routeService;
    private final RecoveryAccessService recoveryAccessService;

    @GetMapping("/access")
    @PreAuthorize("isAuthenticated()")
    public boolean hasRecoveryAccess() {
        return recoveryAccessService.canRestoreOperations();
    }

    @GetMapping("/routes")
    @PreAuthorize("@recoveryAccessService.canRestoreOperations()")
    public List<RecoveryRouteSummaryResponse> getRoutesForRecovery() {
        return recoveryService.getRoutesForRecovery();
    }

    @GetMapping("/routes/{routeId}")
    @PreAuthorize("@recoveryAccessService.canRestoreOperations()")
    public RouteResponse getRouteForRecovery(@PathVariable Long routeId) {
        return RouteResponse.fromEntity(routeService.getRouteById(routeId));
    }

    @PostMapping("/routes/{routeId}/finish")
    @PreAuthorize("@recoveryAccessService.canRestoreOperations()")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void finishRouteAfterOutage(
            @PathVariable Long routeId,
            @Valid @RequestBody FinishRouteAfterOutageRequest request){
        routeService.finishRouteAfterOutage(routeId, request);
    }

    @PatchMapping("/ambulances/{id}/state")
    @PreAuthorize("@recoveryAccessService.canRestoreOperations()")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void restoreAmbulanceState(
            @PathVariable Long id,
            @Valid @RequestBody RestoreAmbulanceStateRequest request) {
        recoveryService.restoreAmbulanceState(request, id);
    }

}
