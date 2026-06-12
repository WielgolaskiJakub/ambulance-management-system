package pl.jakub.ambulancemanagement.routes.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import pl.jakub.ambulancemanagement.routes.model.RouteFinishOrderAction;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class RouteFinishRequest {

    @NotNull
    @PositiveOrZero
    private Integer distanceKm;

    @Size(max = 1000)
    private String notes;

    @NotNull
    private RouteFinishOrderAction orderAction;

}
