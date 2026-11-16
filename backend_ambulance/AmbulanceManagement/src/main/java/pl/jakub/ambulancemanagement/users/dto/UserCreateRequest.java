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

    @Email
    private String email;

    @NotNull
    private UserRole userRole;

    @NotNull
    private Boolean canWorkAsSanitary;
}

