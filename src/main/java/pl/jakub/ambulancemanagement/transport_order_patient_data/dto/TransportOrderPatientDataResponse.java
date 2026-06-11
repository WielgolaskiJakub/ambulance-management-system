package pl.jakub.ambulancemanagement.transport_order_patient_data.dto;

import pl.jakub.ambulancemanagement.transport_order_patient_data.model.TransportOrderPatientData;

import java.time.LocalDateTime;

public record TransportOrderPatientDataResponse (
        Long id,
        Long transportOrderId,
        String patientFirstName,
        String patientLastName,
        String pickupDetails,
        boolean anonymized,
        LocalDateTime anonymizedAt) {

    public static TransportOrderPatientDataResponse fromEntity(TransportOrderPatientData patientData) {
        boolean anonymized = patientData.getAnonymizedAt() != null;

        return new TransportOrderPatientDataResponse(
                patientData.getId(),
                patientData.getTransportOrder().getId(),
                anonymized ? null : patientData.getPatientFirstName(),
                anonymized ? null : patientData.getPatientLastName(),
                anonymized ? null : patientData.getPickupDetails(),
                anonymized,
                patientData.getAnonymizedAt()
        );
    }
}
