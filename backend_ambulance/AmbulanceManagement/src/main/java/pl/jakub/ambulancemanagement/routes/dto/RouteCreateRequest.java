package pl.jakub.ambulancemanagement.routes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import lombok.Getter;
import lombok.Setter;

import java.util.List;


@Getter
@Setter
public class RouteCreateRequest {

    @NotEmpty
    private List<Long> transportOrderIds;

    @NotNull
    private Long shiftId;

    @NotBlank
    private String startAddress;

    @NotBlank
    private String actualDestinationAddress;

    private String notes;
}
