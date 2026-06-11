package pl.jakub.ambulancemanagement.route_members.dto;


import pl.jakub.ambulancemanagement.route_members.model.RouteMember;
import pl.jakub.ambulancemanagement.route_members.model.RouteMemberRole;
import pl.jakub.ambulancemanagement.route_members.model.RouteMemberSource;


public record RouteMemberResponse(
        Long id,
        Long routeId,
        Long userId,
        String memberName,
        RouteMemberRole role,
        RouteMemberSource source
) {

    public static RouteMemberResponse fromEntity(RouteMember routeMember){
        return new RouteMemberResponse(
                routeMember.getId(),
                routeMember.getRoute().getId(),
                routeMember.getUser() != null ? routeMember.getUser().getId() : null,
                routeMember.getMemberName(),
                routeMember.getRole(),
                routeMember.getSource()
        );
    }
}
