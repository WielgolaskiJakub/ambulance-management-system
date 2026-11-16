package pl.jakub.ambulancemanagement.users.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserCreateResponse {

    private UserResponse user;

    private String temporaryPassword;

}
