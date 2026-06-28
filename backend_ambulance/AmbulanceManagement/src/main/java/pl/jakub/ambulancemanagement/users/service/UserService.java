package pl.jakub.ambulancemanagement.users.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import pl.jakub.ambulancemanagement.auth.security.CurrentUserService;
import pl.jakub.ambulancemanagement.exception.ApiException;
import pl.jakub.ambulancemanagement.exception.ErrorCode;
import pl.jakub.ambulancemanagement.users.model.User;
import pl.jakub.ambulancemanagement.users.repository.UserRepository;
import pl.jakub.ambulancemanagement.users.dto.*;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUserService currentUserService;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
    }

    public User createUser(UserCreateRequest request) {

        String username = request.getUsername().trim();

        if (userRepository.existsByUsername(username)) {
            throw new ApiException(ErrorCode.USERNAME_ALREADY_EXISTS);
        }

        String email = null;

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            email = request.getEmail().trim().toLowerCase();

            if (userRepository.existsByEmail(email)) {
                throw new ApiException(ErrorCode.EMAIL_ALREADY_EXISTS);
            }
        }

        User user = new User();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.getTemporaryPassword()));
        user.setUserRole(request.getUserRole());
        user.setActive(true);
        user.setMustChangePassword(true);
        return userRepository.save(user);
    }

    public User updateUserByPutAdmin(UserAdminUpdateRequest request, long id) {
        User userToUpdate = getUserById(id);

        String username = request.getUsername().trim();

        boolean usernameChanged = !userToUpdate.getUsername().equals(username);
        boolean usernameAlreadyExists = userRepository.existsByUsername(username);

        if (usernameChanged && usernameAlreadyExists) {
            throw new ApiException(ErrorCode.USERNAME_ALREADY_EXISTS);
        }

        String email = null;

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            email = request.getEmail().trim().toLowerCase();

            boolean emailChanged = !java.util.Objects.equals(userToUpdate.getEmail(), email);
            boolean emailAlreadyExists = userRepository.existsByEmail(email);

            if (emailChanged && emailAlreadyExists) {
                throw new ApiException(ErrorCode.EMAIL_ALREADY_EXISTS);
            }
        }

        userToUpdate.setFirstName(request.getFirstName());
        userToUpdate.setLastName(request.getLastName());
        userToUpdate.setUsername(username);
        userToUpdate.setEmail(email);
        userToUpdate.setUserRole(request.getUserRole());
        userToUpdate.setActive(request.getActive());

        return userRepository.save(userToUpdate);
    }

    public User updateUserByPatchAdmin(UserAdminPatchRequest request, long id) {
        User userToUpdate = getUserById(id);

        if (request.getFirstName() != null) {
            userToUpdate.setFirstName(request.getFirstName());
        }

        if (request.getLastName() != null) {
            userToUpdate.setLastName(request.getLastName());
        }

        if (request.getUsername() != null) {
            String username = request.getUsername().trim();

            boolean usernameChanged = !userToUpdate.getUsername().equals(username);
            boolean usernameAlreadyExists = userRepository.existsByUsername(username);

            if (usernameChanged && usernameAlreadyExists) {
                throw new ApiException(ErrorCode.USERNAME_ALREADY_EXISTS);
            }

            userToUpdate.setUsername(username);
        }

        if (request.getEmail() != null) {
            String email = null;

            if (!request.getEmail().isBlank()) {
                email = request.getEmail().trim().toLowerCase();
            }

            boolean emailChanged = !java.util.Objects.equals(userToUpdate.getEmail(), email);

            if (emailChanged && email != null && userRepository.existsByEmail(email)) {
                throw new ApiException(ErrorCode.EMAIL_ALREADY_EXISTS);
            }

            userToUpdate.setEmail(email);
        }

        if (request.getUserRole() != null) {
            userToUpdate.setUserRole(request.getUserRole());
        }

        if (request.getActive() != null) {
            userToUpdate.setActive(request.getActive());
        }

        return userRepository.save(userToUpdate);
    }

    public void deleteUserById(long id) {
        User user = getUserById(id);
        user.setActive(false);
        userRepository.save(user);
    }

    public void changeTemporaryPasswordByCurrentUser(UserChangeTemporaryPasswordRequest request) {
        User currentUser = currentUserService.getCurrentUser();

        if (!Boolean.TRUE.equals(currentUser.getMustChangePassword())) {
            throw new ApiException(ErrorCode.PASSWORD_CHANGE_NOT_REQUIRED);
        }

        if (!passwordEncoder.matches(request.getTemporaryPassword(), currentUser.getPasswordHash())) {
            throw new ApiException(ErrorCode.INVALID_TEMPORARY_PASSWORD);
        }

        currentUser.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        currentUser.setMustChangePassword(false);

        userRepository.save(currentUser);
    }

    public void resetTemporaryPasswordByAdmin(AdminResetTemporaryPasswordRequest request, long id) {
        User userToUpdate = getUserById(id);

        userToUpdate.setPasswordHash(passwordEncoder.encode(request.getTemporaryPassword()));
        userToUpdate.setMustChangePassword(true);

        userRepository.save(userToUpdate);
    }

    public void changePasswordByUser(UserChangePasswordRequest request) {
        User currentUser = currentUserService.getCurrentUser();

        if (Boolean.TRUE.equals(currentUser.getMustChangePassword())) {
            throw new ApiException(ErrorCode.PASSWORD_CHANGE_REQUIRED);
        }

        if (!passwordEncoder.matches(request.getOldPassword(), currentUser.getPasswordHash())) {
            throw new ApiException(ErrorCode.INVALID_OLD_PASSWORD);
        }
        currentUser.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(currentUser);
    }

}
