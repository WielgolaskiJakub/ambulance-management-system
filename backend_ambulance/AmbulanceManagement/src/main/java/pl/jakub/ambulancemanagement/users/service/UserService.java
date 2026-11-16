package pl.jakub.ambulancemanagement.users.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import pl.jakub.ambulancemanagement.auth.security.CurrentUserService;
import pl.jakub.ambulancemanagement.exception.ApiException;
import pl.jakub.ambulancemanagement.exception.ErrorCode;
import pl.jakub.ambulancemanagement.shifts.model.ShiftStatus;
import pl.jakub.ambulancemanagement.users.model.User;
import pl.jakub.ambulancemanagement.users.model.UserRole;
import pl.jakub.ambulancemanagement.users.repository.UserRepository;
import pl.jakub.ambulancemanagement.users.dto.*;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUserService currentUserService;

    private static final String UPPERCASE_LETTERS ="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String LOWERCASE_LETTERS ="abcdefghijklmnopqrstuvwxyz";
    private static final String DIGITS ="0123456789";

    private static final String PASSWORD_CHARACTERS = UPPERCASE_LETTERS + LOWERCASE_LETTERS + DIGITS;

    private static final int TEMPORARY_PASSWORD_LENGTH = 12;

    private final SecureRandom secureRandom = new SecureRandom();

    public List<User> getAllUsersVisibleForCurrentUser() {
        if(currentUserIsAdmin()) {
            return userRepository.findAll();
        }
        return userRepository.findByUserRoleNot(UserRole.ADMIN);
    }

    public User getUserById(long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
    }

    public User getUserByIdForManagement(long id){
        User user = getUserById(id);
        validateCurrentUserCanView(user);
        return user;
    }

    public List<User> getRouteMemberCandidates(Long routeId) {
        return userRepository.findRouteMemberCandidates(
                routeId,
                LocalDateTime.now(),
                ShiftStatus.ACTIVE
        );
    }

    public List<User> getAvailableSanitaryMembers(){
        return userRepository.findByActiveTrueAndCanWorkAsSanitaryTrueOrderByLastNameAscFirstNameAsc();
    }
    public UserCreateResponse createUser(UserCreateRequest request) {

        validateCurrentUserCanAssignRole(request.getUserRole());

        String username = generateUsername(request.getFirstName(), request.getLastName());

        String temporaryPassword = generateTemporaryPassword();

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
        user.setPasswordHash(passwordEncoder.encode(temporaryPassword));
        user.setUserRole(request.getUserRole());
        user.setActive(true);
        user.setMustChangePassword(true);
        user.setCanWorkAsSanitary(Boolean.TRUE.equals(request.getCanWorkAsSanitary()));

        User savedUser = userRepository.save(user);

        return new UserCreateResponse(
                UserResponse.fromEntity(savedUser),
                temporaryPassword
        );
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
        userToUpdate.setCanWorkAsSanitary(Boolean.TRUE.equals(request.getCanWorkAsSanitary()));

        return userRepository.save(userToUpdate);
    }

    public User updateUserByPatchAdmin(UserAdminPatchRequest request, long id) {
        User userToUpdate = getUserById(id);

        validateCurrentUserCanManage(userToUpdate);

        if (request.getFirstName() != null) {
           String firstName = request.getFirstName().trim();
            if(firstName.isBlank()){
                throw new ApiException(ErrorCode.USER_FIELD_CANNOT_BE_BLANK);
            }
            userToUpdate.setFirstName(firstName);
        }

        if (request.getLastName() != null) {
            String lastName = request.getLastName().trim();
            if(lastName.isBlank()){
                throw new ApiException(ErrorCode.USER_FIELD_CANNOT_BE_BLANK);
            }
            userToUpdate.setLastName(lastName);
        }

        if (request.getUsername() != null) {
            String username = request.getUsername().trim();

            if (username.isBlank()) {
                throw new ApiException(ErrorCode.USER_FIELD_CANNOT_BE_BLANK);
            }

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
            validateCurrentUserCanAssignRole(request.getUserRole());
            userToUpdate.setUserRole(request.getUserRole());
        }

        if (request.getActive() != null) {
            userToUpdate.setActive(request.getActive());
        }
        if (request.getCanWorkAsSanitary() != null) {
            userToUpdate.setCanWorkAsSanitary(request.getCanWorkAsSanitary());
        }

        return userRepository.save(userToUpdate);
    }

    public void deleteUserById(long id) {
        User user = getUserById(id);
        validateCurrentUserCanManage(user);
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

        if (passwordEncoder.matches(request.getNewPassword(), currentUser.getPasswordHash())) {
            throw new ApiException(ErrorCode.NEW_PASSWORD_SAME_AS_CURRENT);
        }

        currentUser.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        currentUser.setMustChangePassword(false);

        userRepository.save(currentUser);
    }

   public UserTemporaryPasswordResetResponse resetTemporaryPasswordByAdmin(long id){
        User userToUpdate = getUserById(id);

        validateCurrentUserCanManage(userToUpdate);

        String temporaryPassword = generateTemporaryPassword();

        userToUpdate.setPasswordHash(passwordEncoder.encode(temporaryPassword));
        userToUpdate.setMustChangePassword(true);

        userRepository.save(userToUpdate);

        return new UserTemporaryPasswordResetResponse(
                userToUpdate.getUsername(),
                temporaryPassword
        );
   }

    public void changePasswordByUser(UserChangePasswordRequest request) {
        User currentUser = currentUserService.getCurrentUser();

        if (Boolean.TRUE.equals(currentUser.getMustChangePassword())) {
            throw new ApiException(ErrorCode.PASSWORD_CHANGE_REQUIRED);
        }

        if (!passwordEncoder.matches(request.getOldPassword(), currentUser.getPasswordHash())) {
            throw new ApiException(ErrorCode.INVALID_OLD_PASSWORD);
        }
        if(passwordEncoder.matches(request.getNewPassword(), currentUser.getPasswordHash())){
            throw new ApiException(ErrorCode.NEW_PASSWORD_SAME_AS_CURRENT);
        }
        currentUser.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(currentUser);
    }

    private boolean currentUserIsAdmin(){
        return currentUserService.getCurrentUser().getUserRole() == UserRole.ADMIN;
    }

    private boolean isProtectedRole(UserRole role){
        return role == UserRole.ADMIN || role == UserRole.MANAGER;
    }

    private void validateCurrentUserCanView(User user){
        if(!currentUserIsAdmin() && user.getUserRole() == UserRole.ADMIN){
            throw new ApiException(ErrorCode.USER_MANAGEMENT_ACCESS_DENIED);
        }
    }

    private void validateCurrentUserCanManage(User user){
        if(!currentUserIsAdmin() && isProtectedRole(user.getUserRole())){
            throw new ApiException(ErrorCode.USER_MANAGEMENT_ACCESS_DENIED);
        }
    }

    private void validateCurrentUserCanAssignRole(UserRole requestedRole){
        if(!currentUserIsAdmin() && isProtectedRole(requestedRole)) {
            throw new ApiException(ErrorCode.USER_MANAGEMENT_ACCESS_DENIED);
        }
    }

    private String generateUsername(String firstName,  String lastName) {

        firstName = firstName.toLowerCase().trim();
        lastName = lastName.toLowerCase().trim();

        for(int lettersFromFirstName = 1; lettersFromFirstName <= firstName.length(); lettersFromFirstName++){
            String candidate = firstName.substring(0, lettersFromFirstName) + lastName;

            if(!userRepository.existsByUsername(candidate)){
                return candidate;
            }
        }
        String baseUsername = firstName+lastName;
        int suffix = 2;

        while(userRepository.existsByUsername(baseUsername + suffix)){
            suffix++;
        }
        return baseUsername + suffix;
    }

    private String generateTemporaryPassword(){
        char[] password = new char[TEMPORARY_PASSWORD_LENGTH];

        password[0] = getRandomCharacter(UPPERCASE_LETTERS);
        password[1] = getRandomCharacter(LOWERCASE_LETTERS);
        password[2] = getRandomCharacter(DIGITS);

        for(int index = 3; index < password.length; index++){
            password[index] = getRandomCharacter(PASSWORD_CHARACTERS);
        }
        shufflePasswordCharacters(password);

        return new String(password);
    }

    private char getRandomCharacter(String characters) {
        int randomIndex = secureRandom.nextInt(characters.length());
        return characters.charAt(randomIndex);
    }

    private void shufflePasswordCharacters(char[] password){
        for(int index = password.length -1; index > 0; index--){
            int randomIndex = secureRandom.nextInt(index + 1);

            char temporaryCharacter = password[index];
            password[index] = password[randomIndex];
            password[randomIndex] = temporaryCharacter;
        }
    }
}
