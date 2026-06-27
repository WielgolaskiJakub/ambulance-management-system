package pl.jakub.ambulancemanagement.users.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminResetTemporaryPasswordRequest {

    @NotBlank
    @Size(min = 8, message = "Hasło musi mieć minimum 8 znaków")
    @Pattern(
            regexp = "^(?=.*[A-Z])(?=.*\\d).+$",
            message = "Hasło musi zawierać wielką literę i cyfrę"
    )
    private String temporaryPassword;
}

