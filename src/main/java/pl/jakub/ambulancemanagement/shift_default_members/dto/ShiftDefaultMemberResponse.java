package pl.jakub.ambulancemanagement.shift_default_members.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import pl.jakub.ambulancemanagement.route_members.model.RouteMemberRole;
import pl.jakub.ambulancemanagement.shift_default_members.model.ShiftDefaultMember;
import pl.jakub.ambulancemanagement.users.model.User;


import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class ShiftDefaultMemberResponse {
    private Long id;
    private Long userId;
    private Long shiftId;

    private String firstName;
    private String lastName;

    private RouteMemberRole role;
    private LocalDateTime startTime;
    private LocalDateTime endTime;


    public static ShiftDefaultMemberResponse fromEntity(ShiftDefaultMember  shiftDefaultMember) {

        User user = shiftDefaultMember.getUser();

        return new ShiftDefaultMemberResponse(
                shiftDefaultMember.getId(),
                shiftDefaultMember.getUser().getId(),
                shiftDefaultMember.getShift().getId(),
                user.getFirstName(),
                user.getLastName(),
                shiftDefaultMember.getRole(),
                shiftDefaultMember.getStartTime(),
                shiftDefaultMember.getEndTime()
        );
    }
}
