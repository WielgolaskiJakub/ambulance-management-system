package pl.jakub.ambulancemanagement.users.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pl.jakub.ambulancemanagement.users.dto.*;
import pl.jakub.ambulancemanagement.users.model.User;
import pl.jakub.ambulancemanagement.users.service.UserService;

import java.util.List;


@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public List<UserResponse> getAllUsers() {
        return userService.getAllUsers().stream().map(UserResponse::fromEntity).toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public UserResponse getUserById(@PathVariable long id) {
        User user = userService.getUserById(id);
        return UserResponse.fromEntity(user);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse createUser(@Valid @RequestBody UserCreateRequest request) {
        User createdUser = userService.createUser(request);
        return UserResponse.fromEntity(createdUser);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public UserResponse updateUserByPutAdmin(
            @PathVariable long id,
            @Valid @RequestBody UserAdminUpdateRequest request
    ) {
        User updatedUser = userService.updateUserByPutAdmin(request, id);
        return UserResponse.fromEntity(updatedUser);
    }


    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public UserResponse updateUserByPatchAdmin(
            @PathVariable long id,
            @Valid @RequestBody UserAdminPatchRequest request
    ) {
        User updatedUser = userService.updateUserByPatchAdmin(request, id);
        return UserResponse.fromEntity(updatedUser);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUserById(@PathVariable long id) {
        userService.deleteUserById(id);
    }

    @PatchMapping("/me/temporary-password")
    @PreAuthorize("isAuthenticated()")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changeTemporaryPasswordByUser(
            @Valid @RequestBody UserChangeTemporaryPasswordRequest request
    ) {
        userService.changeTemporaryPasswordByCurrentUser(request);
    }

    @PatchMapping("/{id}/temporary-password/reset")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetTemporaryPasswordByAdmin(@PathVariable long id,
                                              @Valid @RequestBody AdminResetTemporaryPasswordRequest request) {
        userService.resetTemporaryPasswordByAdmin(request, id);
    }

    @PatchMapping("/me/password")
    @PreAuthorize("isAuthenticated()")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePasswordByUser(
                        @Valid @RequestBody UserChangePasswordRequest request
    ) {
        userService.changePasswordByUser(request);
    }


}
