package pl.jakub.ambulancemanagement.shift_default_members.dto;


import lombok.Getter;
import lombok.Setter;
import pl.jakub.ambulancemanagement.users.model.UserRole;

import java.time.LocalDateTime;

@Getter
@Setter
public class UpdateShiftDefaultMemberByUserRequest {

    private Long userId;
    private Long shiftId;
    private UserRole role;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
}
