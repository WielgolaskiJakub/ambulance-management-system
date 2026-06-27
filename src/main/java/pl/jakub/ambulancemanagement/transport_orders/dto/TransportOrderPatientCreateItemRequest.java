package pl.jakub.ambulancemanagement.transport_orders.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TransportOrderPatientCreateItemRequest {

    @NotBlank
    @Size(max = 100)
    private String patientFirstName;

    @NotBlank
    @Size(max = 100)
    private String patientLastName;

    private String pickupDetails;
}
