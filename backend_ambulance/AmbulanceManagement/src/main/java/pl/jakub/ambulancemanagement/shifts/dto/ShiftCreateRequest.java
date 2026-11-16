package pl.jakub.ambulancemanagement.shifts.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import pl.jakub.ambulancemanagement.shifts.model.ShiftType;

import java.time.LocalDateTime;

@Getter
@Setter
public class ShiftCreateRequest {


    @NotNull
    private Long ambulanceId;

    @NotNull
    private ShiftType shiftType;

    @NotNull
    private LocalDateTime startTime;

    @NotNull
    private LocalDateTime endTime;

    private ShiftDefaultMemberCreateRequest defaultMember;

}