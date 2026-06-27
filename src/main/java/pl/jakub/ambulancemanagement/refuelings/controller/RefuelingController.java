package pl.jakub.ambulancemanagement.refuelings.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pl.jakub.ambulancemanagement.refuelings.dto.RefuelingCreateRequest;
import pl.jakub.ambulancemanagement.refuelings.dto.RefuelingManagerUpdateRequest;
import pl.jakub.ambulancemanagement.refuelings.dto.RefuelingResponse;
import pl.jakub.ambulancemanagement.refuelings.dto.RefuelingUserUpdateRequest;
import pl.jakub.ambulancemanagement.refuelings.model.Refueling;
import pl.jakub.ambulancemanagement.refuelings.service.RefuelingService;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/refuelings")
public class RefuelingController {

    private final RefuelingService refuelingService;

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public List<RefuelingResponse> getAllRefuelings() {
        return refuelingService.getAllRefuelings()
                .stream()
                .map(RefuelingResponse::fromEntity)
                .toList();
    }
    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('DRIVER')")
    public List<RefuelingResponse> getMyRefuelings() {
        return refuelingService.getMyRefuelings()
                .stream()
                .map(RefuelingResponse::fromEntity)
                .toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public RefuelingResponse getRefuelingById(@PathVariable Long id) {
        Refueling refueling = refuelingService.getRefuelingById(id);
        return RefuelingResponse.fromEntity(refueling);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DRIVER')")
    @ResponseStatus(HttpStatus.CREATED)
    public RefuelingResponse createRefueling(@Valid @RequestBody RefuelingCreateRequest request) {
        Refueling refueling = refuelingService.createRefueling(request);
        return RefuelingResponse.fromEntity(refueling);
    }

    @PatchMapping("/{id}/user")
    @PreAuthorize("hasAnyRole('DRIVER')")
    public RefuelingResponse updateRefuelingByUser(
            @PathVariable Long id,
            @Valid @RequestBody RefuelingUserUpdateRequest request
    ) {
        Refueling refueling = refuelingService.updateRefuelingByUser(request, id);
        return RefuelingResponse.fromEntity(refueling);
    }

    @PatchMapping("/{id}/manager")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public RefuelingResponse updateRefuelingByManager(
            @PathVariable Long id,
            @Valid @RequestBody RefuelingManagerUpdateRequest request
    ) {
        Refueling refueling = refuelingService.updateRefuelingByManager(request, id);
        return RefuelingResponse.fromEntity(refueling);
    }
}