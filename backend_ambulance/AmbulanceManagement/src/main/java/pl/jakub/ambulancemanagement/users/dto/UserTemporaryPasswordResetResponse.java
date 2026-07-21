package pl.jakub.ambulancemanagement.users.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserTemporaryPasswordResetResponse {

    private String username;

    private String temporaryPassword;
}
