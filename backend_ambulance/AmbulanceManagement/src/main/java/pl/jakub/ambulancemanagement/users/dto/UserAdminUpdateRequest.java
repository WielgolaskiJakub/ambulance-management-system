package pl.jakub.ambulancemanagement.users.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import pl.jakub.ambulancemanagement.users.model.UserRole;

@Getter
@Setter
public class UserAdminUpdateRequest {

    @NotBlank
    private String firstName;

    @NotBlank
    private String lastName;

    @NotBlank
    private String username;

    @Email
    private String email;

    @NotNull
    private UserRole userRole;

    @NotNull
    private Boolean active;
}