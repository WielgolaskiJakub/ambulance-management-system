package pl.jakub.ambulancemanagement.transport_orders.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AssignOrderNumberRequest {

    @NotBlank
    @Size(max = 100)
    private String orderNumber;
}
