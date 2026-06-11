package pl.jakub.ambulancemanagement.shifts.dto;


import lombok.AllArgsConstructor;
import lombok.Getter;
import pl.jakub.ambulancemanagement.shifts.model.Shift;
import pl.jakub.ambulancemanagement.shifts.model.ShiftStatus;
import pl.jakub.ambulancemanagement.shifts.model.ShiftType;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class ShiftResponse {

    private Long id;
    private Long driverId;
    private Long ambulanceId;
    private ShiftType shiftType;
    private Long createdById;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private ShiftStatus status;
    private LocalDateTime createdAt;


    public static ShiftResponse fromEntity(Shift shift) {
        return new ShiftResponse(
                shift.getId(),
                shift.getDriver().getId(),
                shift.getAmbulance().getId(),
                shift.getShiftType(),
                shift.getCreatedBy().getId(),
                shift.getStartTime(),
                shift.getEndTime(),
                shift.getStatus(),
                shift.getCreatedAt()
        );
    }

}
