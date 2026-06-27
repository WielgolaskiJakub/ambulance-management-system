package pl.jakub.ambulancemanagement.route_members.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import pl.jakub.ambulancemanagement.route_members.model.RouteMemberRole;
import pl.jakub.ambulancemanagement.route_members.model.RouteMemberSource;

@Getter
@Setter
public class RouteMemberCreateRequest {

    private Long userId;

    @Size(max = 255)
    private String memberName;

    @NotNull
    private RouteMemberRole memberRole;
    @NotNull
    private RouteMemberSource memberSource;

}
