package pl.jakub.ambulancemanagement.users.dto;

import jakarta.validation.constraints.Email;
import lombok.Getter;
import lombok.Setter;
import pl.jakub.ambulancemanagement.users.model.UserRole;

@Getter
@Setter
public class UserAdminPatchRequest {

    private String firstName;
    private String lastName;
    private String username;
    @Email
    private String email;
    private UserRole userRole;
    private Boolean active;
}

