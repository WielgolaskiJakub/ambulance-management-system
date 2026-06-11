package pl.jakub.ambulancemanagement.users.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pl.jakub.ambulancemanagement.users.dto.*;
import pl.jakub.ambulancemanagement.users.model.User;
import pl.jakub.ambulancemanagement.users.service.UserService;

import java.util.List;

// TODO po dodatniu jwt zmienic requestMapping na api/v1/users/admin i dodać 'me' dla usera do zmiany hasla

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public List<UserResponse> getAllUsers() {
        return userService.getAllUsers().stream().map(UserResponse::fromEntity).toList();
    }

    @GetMapping("/{id}")
    public UserResponse getUserById(@PathVariable long id) {
        User user = userService.getUserById(id);
        return UserResponse.fromEntity(user);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse createUser(@Valid @RequestBody UserCreateRequest request) {
        User createdUser = userService.createUser(request);
        return UserResponse.fromEntity(createdUser);
    }

    @PutMapping("/{id}")
    public UserResponse updateUserByPutAdmin(
            @PathVariable long id,
            @Valid @RequestBody UserAdminUpdateRequest request
    ) {
        User updatedUser = userService.updateUserByPutAdmin(request, id);
        return UserResponse.fromEntity(updatedUser);
    }


    @PatchMapping("/{id}")
    public UserResponse updateUserByPatchAdmin(
            @PathVariable long id,
            @Valid @RequestBody UserAdminPatchRequest request
    ) {
        User updatedUser = userService.updateUserByPatchAdmin(request, id);
        return UserResponse.fromEntity(updatedUser);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUserById(@PathVariable long id) {
        userService.deleteUserById(id);
    }

    @PatchMapping("/{id}/temporary-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changeTemporaryPasswordByUser(
            @PathVariable long id,
            @Valid @RequestBody UserChangeTemporaryPasswordRequest request
    ) {
        userService.changeTemporaryPasswordByUser(request, id);
    }

    @PatchMapping("/{id}/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePasswordByUser(
            @PathVariable long id,
            @Valid @RequestBody UserChangePasswordRequest request
    ) {
        userService.changePasswordByUser(request, id);
    }
}
