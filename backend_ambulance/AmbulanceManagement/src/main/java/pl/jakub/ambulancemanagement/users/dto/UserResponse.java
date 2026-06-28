package pl.jakub.ambulancemanagement.users.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import pl.jakub.ambulancemanagement.users.model.UserRole;
import pl.jakub.ambulancemanagement.users.model.User;

@Getter
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String username;
    private String email;
    private UserRole userRole;
    private Boolean active;
    private Boolean mustChangePassword;


    public static UserResponse fromEntity(User user) {
        return new UserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getUsername(),
                user.getEmail(),
                user.getUserRole(),
                user.getActive(),
                user.getMustChangePassword()
        );
    }
}

