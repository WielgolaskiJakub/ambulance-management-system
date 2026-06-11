package pl.jakub.ambulancemanagement.users.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import pl.jakub.ambulancemanagement.users.model.UserRole;

@Getter
@Setter
public class UserCreateRequest {

    @NotBlank
    private String firstName;

    @NotBlank
    private String lastName;

    @NotBlank
    private String username;

    @Email
    private String email;

    @NotBlank
    @Size(min = 8, message = "Hasło musi mieć minimum 8 znaków")
    @Pattern(
            regexp = "^(?=.*[A-Z])(?=.*\\d).+$",
            message = "Hasło musi zawierać wielką literę i cyfrę"
    )
    private String temporaryPassword;

    @NotNull
    private UserRole userRole;
}

