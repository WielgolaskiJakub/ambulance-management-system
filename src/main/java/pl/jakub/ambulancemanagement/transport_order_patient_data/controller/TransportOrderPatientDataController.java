package pl.jakub.ambulancemanagement.transport_order_patient_data.controller;

import jakarta.validation.Valid;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pl.jakub.ambulancemanagement.transport_order_patient_data.dto.TransportOrderPatientDataCreateRequest;
import pl.jakub.ambulancemanagement.transport_order_patient_data.dto.TransportOrderPatientDataResponse;
import pl.jakub.ambulancemanagement.transport_order_patient_data.dto.TransportOrderPatientDataUpdateRequest;
import pl.jakub.ambulancemanagement.transport_order_patient_data.model.TransportOrderPatientData;
import pl.jakub.ambulancemanagement.transport_order_patient_data.service.TransportOrderPatientDataService;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/transport-order-patient-data")
public class TransportOrderPatientDataController {

    private final TransportOrderPatientDataService transportOrderPatientDataService;


    @GetMapping("/{id}")
    public TransportOrderPatientDataResponse getTransportOrderPatientDataById(@PathVariable Long id) {
        TransportOrderPatientData patientData =
                transportOrderPatientDataService.getTransportOrderPatientDataById(id);
        return TransportOrderPatientDataResponse.fromEntity(patientData);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TransportOrderPatientDataResponse createTransportOrderPatientData(
            @Valid @RequestBody TransportOrderPatientDataCreateRequest request
    ) {
        TransportOrderPatientData patientData =
                transportOrderPatientDataService.createTransportOrderPatientData(request);

        return TransportOrderPatientDataResponse.fromEntity(patientData);
    }

    @PatchMapping("/{id}")
    public TransportOrderPatientDataResponse updateTransportOrderPatientData(
            @PathVariable Long id,
            @Valid @RequestBody TransportOrderPatientDataUpdateRequest request
    ) {
        TransportOrderPatientData patientData =
                transportOrderPatientDataService.updateTransportOrderPatientData(request, id);

        return TransportOrderPatientDataResponse.fromEntity(patientData);
    }

    @PatchMapping("/{id}/anonymize")
    public TransportOrderPatientDataResponse anonymizeTransportOrderPatientData(@PathVariable long id) {
        TransportOrderPatientData patientData =
                transportOrderPatientDataService.anonymizeTransportOrderPatientData(id);

        return TransportOrderPatientDataResponse.fromEntity(patientData);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTransportOrderPatientData(@PathVariable Long id) {
        transportOrderPatientDataService.deleteTransportOrderPatientData(id);
    }
}