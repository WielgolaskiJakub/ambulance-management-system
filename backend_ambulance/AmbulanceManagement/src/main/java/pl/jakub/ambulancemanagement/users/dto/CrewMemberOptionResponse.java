package pl.jakub.ambulancemanagement.users.dto;

import pl.jakub.ambulancemanagement.users.model.User;
import pl.jakub.ambulancemanagement.users.model.UserRole;

public record CrewMemberOptionResponse(
        Long id,
        String firstName,
        String lastName,
        UserRole userRole
) {
    public static CrewMemberOptionResponse fromEntity(User user) {
        return new CrewMemberOptionResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getUserRole()
        );
    }
}
