package pl.jakub.ambulancemanagement.route_members.dto;


import pl.jakub.ambulancemanagement.route_members.model.RouteMember;
import pl.jakub.ambulancemanagement.route_members.model.RouteMemberRole;
import pl.jakub.ambulancemanagement.route_members.model.RouteMemberSource;
import pl.jakub.ambulancemanagement.users.model.User;


public record RouteMemberResponse(
        Long id,
        Long routeId,
        Long userId,
        String memberName,
        String fullName,
        RouteMemberRole role,
        RouteMemberSource source
) {

    public static RouteMemberResponse fromEntity(RouteMember routeMember) {
        User user = routeMember.getUser();

        Long userId = null;
        String fullName;

        if (user != null) {
            userId = user.getId();
            fullName = user.getFirstName() + " " + user.getLastName();
        } else {
            fullName = routeMember.getMemberName();
        }
        return new RouteMemberResponse(
                routeMember.getId(),
                routeMember.getRoute().getId(),
                userId,
                routeMember.getMemberName(),
                fullName,
                routeMember.getRole(),
                routeMember.getSource()
        );
    }
}
