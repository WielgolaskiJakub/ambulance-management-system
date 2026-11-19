package pl.jakub.ambulancemanagement.recovery.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.PositiveOrZero;

import java.time.LocalDateTime;

public record FinishRouteAfterOutageRequest(
        @NotNull
        @PastOrPresent
        LocalDateTime finishedAt,

        @NotNull
        @PositiveOrZero
        Integer finishOdometerKm

){}
