package pl.jakub.ambulancemanagement.shifts.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import pl.jakub.ambulancemanagement.shifts.model.ShiftType;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class ShiftCreateRequest {

    @NotNull
    private Long driverId; // TODO tu JWT daje id i createdBYID tez

    @NotNull
    private Long ambulanceId;

    @NotNull
    private ShiftType shiftType;

    private LocalDate shiftDate;

    @NotNull
    private Long createdById; // tymczasowo, dopóki nie masz logowania

    @NotNull
    private LocalDateTime startTime;

    @NotNull
    private LocalDateTime endTime;

}