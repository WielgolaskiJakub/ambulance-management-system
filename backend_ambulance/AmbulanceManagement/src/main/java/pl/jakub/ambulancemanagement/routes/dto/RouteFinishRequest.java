package pl.jakub.ambulancemanagement.routes.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RouteFinishRequest {

    @NotNull
    @Min(0)
    @Max(999)
    private Integer finishOdometerLastThree;

    @Size(max = 1000)
    private String notes;
}
