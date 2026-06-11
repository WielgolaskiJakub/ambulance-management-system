package pl.jakub.ambulancemanagement.shift_default_members.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import pl.jakub.ambulancemanagement.shift_default_members.model.ShiftDefaultMember;
import pl.jakub.ambulancemanagement.users.model.UserRole;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class ShiftDefaultMemberResponse {
    private Long id;
    private Long userId;
    private Long shiftId;
    private UserRole role;
    private LocalDateTime startTime;
    private LocalDateTime endTime;


    public static ShiftDefaultMemberResponse fromEntity(ShiftDefaultMember  shiftDefaultMember) {
        return new ShiftDefaultMemberResponse(
                shiftDefaultMember.getId(),
                shiftDefaultMember.getUser().getId(),
                shiftDefaultMember.getShift().getId(),
                shiftDefaultMember.getRole(),
                shiftDefaultMember.getStartTime(),
                shiftDefaultMember.getEndTime()
        );
    }
}
