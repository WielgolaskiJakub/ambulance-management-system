package pl.jakub.ambulancemanagement.recovery.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record RestoreAmbulanceStateRequest(

        @NotNull
        @PositiveOrZero
        Integer mileage,

        @NotNull
        @PositiveOrZero
        BigDecimal estimatedFuelLiters,

        @NotBlank
        String reason
) {
}
