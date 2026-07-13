package pl.jakub.ambulancemanagement.transport_order_patient_data.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TransportOrderPatientDataPatchRequest {

    @Size(max = 100)
    private String patientFirstName;

    @Size(max = 100)
    private String patientLastName;

    @Size(max = 255)
    private String pickupDetails;
}
