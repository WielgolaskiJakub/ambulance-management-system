package pl.jakub.ambulancemanagement.recovery.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import pl.jakub.ambulancemanagement.shifts.dto.ShiftDefaultMemberCreateRequest;
import pl.jakub.ambulancemanagement.shifts.model.ShiftType;

import java.time.LocalDateTime;

public record RecoverActiveShiftRequest(

        @NotNull
        @Positive
        Long ambulanceId,

        @NotNull
        @Positive
        Long driverId,

        @NotNull
        ShiftType shiftType,

        @NotNull
        LocalDateTime startTime,

        @NotNull
        LocalDateTime endTime,

        @Valid
        ShiftDefaultMemberCreateRequest defaultMember,

        @NotNull
        @Valid
        RestoreAmbulanceStateRequest ambulanceState
) {

}
