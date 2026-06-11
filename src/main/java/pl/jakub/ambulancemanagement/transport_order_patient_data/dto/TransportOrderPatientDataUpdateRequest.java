package pl.jakub.ambulancemanagement.transport_order_patient_data.dto;


import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TransportOrderPatientDataUpdateRequest {


    private Long transportOrderId;

    @Size(max = 100)
    private String patientFirstName;

    @Size(max = 100)
    private String patientLastName;

    private String pickupDetails;

}
