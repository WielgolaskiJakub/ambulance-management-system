package pl.jakub.ambulancemanagement.recovery.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pl.jakub.ambulancemanagement.auth.security.CurrentUserService;
import pl.jakub.ambulancemanagement.users.model.User;
import pl.jakub.ambulancemanagement.users.model.UserRole;

@Service
@RequiredArgsConstructor
public class RecoveryAccessService {

    private final CurrentUserService currentUserService;

    public boolean canRestoreOperations(){

        User user = currentUserService.getCurrentUser();

        if(!Boolean.TRUE.equals(user.getActive())){
            return false;
        }

        return Boolean.TRUE.equals(user.getCanRestoreOperations())
                || user.getUserRole() == UserRole.ADMIN
                || user.getUserRole() == UserRole.MANAGER;
    }


}
