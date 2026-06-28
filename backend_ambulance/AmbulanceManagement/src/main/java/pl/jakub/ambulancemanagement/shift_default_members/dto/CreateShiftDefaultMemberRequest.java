package pl.jakub.ambulancemanagement.shift_default_members.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import pl.jakub.ambulancemanagement.route_members.model.RouteMemberRole;


import java.time.LocalDateTime;

@Getter
@Setter
public class CreateShiftDefaultMemberRequest {

    @NotNull
    private Long userId;
    @NotNull
    private Long shiftId;
    @NotNull
    private RouteMemberRole role;
    @NotNull
    private LocalDateTime startTime;
    @NotNull
    private LocalDateTime endTime;
}
