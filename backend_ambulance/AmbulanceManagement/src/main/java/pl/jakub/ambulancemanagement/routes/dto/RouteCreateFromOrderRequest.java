package pl.jakub.ambulancemanagement.routes.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RouteCreateFromOrderRequest {

    @NotNull
    private Long shiftId;

    @Size(max = 1000)
    private String notes;
}
