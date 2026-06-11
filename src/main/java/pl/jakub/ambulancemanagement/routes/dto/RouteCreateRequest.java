package pl.jakub.ambulancemanagement.routes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
public class RouteCreateRequest {

    @NotNull
    private Long transportOrderId;

    @NotNull
    private Long shiftId;

    @NotBlank
    private String startAddress;

    @NotBlank
    private String actualDestinationAddress;

    private String notes;
}
