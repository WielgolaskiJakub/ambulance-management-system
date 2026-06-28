package pl.jakub.ambulancemanagement.ambulances.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pl.jakub.ambulancemanagement.ambulances.dto.AmbulanceResponse;
import pl.jakub.ambulancemanagement.ambulances.dto.AmbulanceShortResponse;
import pl.jakub.ambulancemanagement.ambulances.dto.CreateAmbulanceRequest;
import pl.jakub.ambulancemanagement.ambulances.dto.UpdateAmbulanceRequest;
import pl.jakub.ambulancemanagement.ambulances.model.Ambulance;
import pl.jakub.ambulancemanagement.ambulances.service.AmbulanceService;

import java.util.List;

@RestController
@RequestMapping(("/api/v1/ambulances"))
@RequiredArgsConstructor
public class AmbulanceController {

    private final AmbulanceService ambulanceService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public List<AmbulanceResponse> getAllAmbulances() {
        return ambulanceService.getAllAmbulances()
                .stream().map(AmbulanceResponse::fromEntity ).toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public AmbulanceResponse getAmbulanceById(@PathVariable long id) {
        Ambulance ambulance = ambulanceService.getAmbulanceById(id);
        return AmbulanceResponse.fromEntity(ambulance);
    }

    @GetMapping("/available")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DRIVER', 'SANITARY')")
    public List<AmbulanceShortResponse> getAvailableAmbulances() {
        return ambulanceService.getAvailableAmbulances()
                .stream()
                .map(AmbulanceShortResponse::fromEntity)
                .toList();
    }
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @ResponseStatus(HttpStatus.CREATED)
    public AmbulanceResponse createAmbulance(@Valid @RequestBody CreateAmbulanceRequest request) {
        Ambulance newAmbulance = ambulanceService.createAmbulance(request);
        return AmbulanceResponse.fromEntity(newAmbulance);
    }
    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public AmbulanceResponse updateAmbulance(@PathVariable long id, @Valid @RequestBody UpdateAmbulanceRequest request) {
        Ambulance updatedAmbulance = ambulanceService.updateAmbulance(request, id);
        return AmbulanceResponse.fromEntity(updatedAmbulance);
    }
    @PatchMapping("/{id}/out-of-service")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public AmbulanceResponse markAmbulanceOutOfService(@PathVariable long id) {
        Ambulance ambulance = ambulanceService.markAmbulanceOutOfService(id);
        return AmbulanceResponse.fromEntity(ambulance);
    }

    @PatchMapping("/{id}/available")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public AmbulanceResponse markAmbulanceAvailable(@PathVariable long id) {
        Ambulance ambulance = ambulanceService.markAmbulanceAvailable(id);
        return AmbulanceResponse.fromEntity(ambulance);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAmbulanceById(@PathVariable long id) {
        ambulanceService.deactivateAmbulanceById(id);
    }
}
