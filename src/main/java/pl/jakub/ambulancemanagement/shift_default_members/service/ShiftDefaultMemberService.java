package pl.jakub.ambulancemanagement.shift_default_members.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.jakub.ambulancemanagement.auth.security.CurrentUserService;
import pl.jakub.ambulancemanagement.exception.ApiException;
import pl.jakub.ambulancemanagement.exception.ErrorCode;
import pl.jakub.ambulancemanagement.route_members.model.RouteMemberRole;
import pl.jakub.ambulancemanagement.shift_default_members.dto.CreateShiftDefaultMemberRequest;
import pl.jakub.ambulancemanagement.shift_default_members.dto.UpdateShiftDefaultMemberByUserRequest;
import pl.jakub.ambulancemanagement.shift_default_members.model.ShiftDefaultMember;
import pl.jakub.ambulancemanagement.shift_default_members.repository.ShiftDefaultMemberRepository;
import pl.jakub.ambulancemanagement.shifts.model.Shift;
import pl.jakub.ambulancemanagement.shifts.repository.ShiftRepository;
import pl.jakub.ambulancemanagement.users.model.User;
import pl.jakub.ambulancemanagement.users.model.UserRole;
import pl.jakub.ambulancemanagement.users.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShiftDefaultMemberService {

    private final ShiftDefaultMemberRepository shiftDefaultMemberRepository;
    private final UserRepository userRepository;
    private final ShiftRepository shiftRepository;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public List<ShiftDefaultMember> getAllShiftDefaultMembers(){
        return shiftDefaultMemberRepository.findAll();
    }

    @Transactional(readOnly = true)
    public ShiftDefaultMember getShiftDefaultMemberById(Long id){
        return shiftDefaultMemberRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.SHIFT_DEFAULT_MEMBER_NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public List<ShiftDefaultMember> getShiftDefaultMembersByShiftId(long shiftId) {
        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new ApiException(ErrorCode.SHIFT_NOT_FOUND));
        validateCurrentUserCanManageShift(shift);

        return shiftDefaultMemberRepository.findByShift_Id(shift.getId());
    }
    @Transactional
    public ShiftDefaultMember createShiftDefaultMember(CreateShiftDefaultMemberRequest request){

        User user =  userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

        Shift shift = shiftRepository.findById(request.getShiftId())
                .orElseThrow(() -> new ApiException(ErrorCode.SHIFT_NOT_FOUND));
        validateCurrentUserCanManageShift(shift);
        validateShiftDefaultMemberRole(request.getRole());
        validateUserCanBeShiftDefaultMember(user, shift);
        validateShiftDefaultMemberTime(request.getStartTime(),request.getEndTime(),shift);

        if(shiftDefaultMemberRepository.existsByShift_IdAndUser_Id(shift.getId(),user.getId())){
            throw new ApiException(ErrorCode.SHIFT_DEFAULT_MEMBER_ALREADY_EXIST);
        }

        ShiftDefaultMember newShiftDefaultMember = new ShiftDefaultMember();
        newShiftDefaultMember.setUser(user);
        newShiftDefaultMember.setShift(shift);
        newShiftDefaultMember.setRole((request.getRole()));
        newShiftDefaultMember.setStartTime(request.getStartTime());
        newShiftDefaultMember.setEndTime(request.getEndTime());

        return shiftDefaultMemberRepository.save(newShiftDefaultMember);
    }

    @Transactional
    public ShiftDefaultMember updateShiftDefaultMemberByUser(
            Long id,
            UpdateShiftDefaultMemberByUserRequest request
    ) {
        ShiftDefaultMember shiftDefaultMemberToUpdate = getShiftDefaultMemberById(id);

        User user = shiftDefaultMemberToUpdate.getUser();
        Shift shift = shiftDefaultMemberToUpdate.getShift();
        RouteMemberRole role = shiftDefaultMemberToUpdate.getRole();
        LocalDateTime startTime = shiftDefaultMemberToUpdate.getStartTime();
        LocalDateTime endTime = shiftDefaultMemberToUpdate.getEndTime();

        if (request.getUserId() != null) {
            user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
        }

        if (request.getShiftId() != null) {
            shift = shiftRepository.findById(request.getShiftId())
                    .orElseThrow(() -> new ApiException(ErrorCode.SHIFT_NOT_FOUND));
        }

        if (request.getRole() != null) {
            role = request.getRole();
        }

        if (request.getStartTime() != null) {
            startTime = request.getStartTime();
        }

        if (request.getEndTime() != null) {
            endTime = request.getEndTime();
        }

        validateCurrentUserCanManageShift(shift);
        validateShiftDefaultMemberTime(startTime,endTime,shift);
        validateUserCanBeShiftDefaultMember(user, shift);
        validateShiftDefaultMemberRole(role);

        boolean memberChanged =
                !shiftDefaultMemberToUpdate.getUser().getId().equals(user.getId())
                        || !shiftDefaultMemberToUpdate.getShift().getId().equals(shift.getId());

        if (memberChanged && shiftDefaultMemberRepository.existsByShift_IdAndUser_Id(shift.getId(), user.getId())) {
            throw new ApiException(ErrorCode.SHIFT_DEFAULT_MEMBER_ALREADY_EXIST);
        }

        shiftDefaultMemberToUpdate.setUser(user);
        shiftDefaultMemberToUpdate.setShift(shift);
        shiftDefaultMemberToUpdate.setRole(role);
        shiftDefaultMemberToUpdate.setStartTime(startTime);
        shiftDefaultMemberToUpdate.setEndTime(endTime);

        return shiftDefaultMemberRepository.save(shiftDefaultMemberToUpdate);
    }

    @Transactional
    public void deleteShiftDefaultMemberById(long id) {
        ShiftDefaultMember shiftDefaultMember = getShiftDefaultMemberById(id);
        validateCurrentUserCanManageShift(shiftDefaultMember.getShift());
        shiftDefaultMemberRepository.delete(shiftDefaultMember);
    }

    private void validateShiftDefaultMemberRole(RouteMemberRole role) {
        if (role == null) {
            throw new ApiException(ErrorCode.SHIFT_DEFAULT_MEMBER_INVALID_ROLE);
        }

        if (role == RouteMemberRole.DRIVER) {
            throw new ApiException(ErrorCode.SHIFT_DEFAULT_MEMBER_INVALID_ROLE);
        }
    }

    private void validateUserCanBeShiftDefaultMember(User user, Shift shift) {
        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new ApiException(ErrorCode.USER_NOT_ACTIVE);
        }

        if (shift.getDriver().getId().equals(user.getId())) {
            throw new ApiException(ErrorCode.INVALID_SHIFT_TEAM);
        }
    }
    private void validateShiftDefaultMemberTime(
            LocalDateTime startTime,
            LocalDateTime endTime,
            Shift shift
    ) {
        if (startTime == null || endTime == null) {
            throw new ApiException(ErrorCode.INVALID_SHIFT_TIME);
        }

        if (!endTime.isAfter(startTime)) {
            throw new ApiException(ErrorCode.INVALID_SHIFT_TIME);
        }

        if (startTime.isBefore(shift.getStartTime()) || endTime.isAfter(shift.getEndTime())) {
            throw new ApiException(ErrorCode.INVALID_SHIFT_TIME);
        }
    }
    private void validateCurrentUserCanManageShift(Shift shift) {
        User currentUser = currentUserService.getCurrentUser();

        if (currentUser.getUserRole() == UserRole.ADMIN ||
                currentUser.getUserRole() == UserRole.MANAGER) {
            return;
        }

        if (shift.getDriver().getId().equals(currentUser.getId())) {
            return;
        }

        throw new ApiException(ErrorCode.SHIFT_ACCESS_DENIED);
    }
}
