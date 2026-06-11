package pl.jakub.ambulancemanagement.shifts.dto;

import lombok.Getter;
import lombok.Setter;
import pl.jakub.ambulancemanagement.shifts.model.ShiftType;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class ShiftUpdateByUserRequest {

    private Long ambulanceId;
    private ShiftType shiftType;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDate shiftDate;

}
