package pl.jakub.ambulancemanagement.shift_default_members.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pl.jakub.ambulancemanagement.exception.ApiException;
import pl.jakub.ambulancemanagement.exception.ErrorCode;
import pl.jakub.ambulancemanagement.shift_default_members.dto.CreateShiftDefaultMemberRequest;
import pl.jakub.ambulancemanagement.shift_default_members.dto.UpdateShiftDefaultMemberByUserRequest;
import pl.jakub.ambulancemanagement.shift_default_members.model.ShiftDefaultMember;
import pl.jakub.ambulancemanagement.shift_default_members.repository.ShiftDefaultMemberRepository;
import pl.jakub.ambulancemanagement.shifts.model.Shift;
import pl.jakub.ambulancemanagement.shifts.model.ShiftType;
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

    public List<ShiftDefaultMember> getAllShiftDefaultMembers(){
        return shiftDefaultMemberRepository.findAll();
    }

    public ShiftDefaultMember getShiftDefaultMemberById(Long id){
        return shiftDefaultMemberRepository.findById(id).orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
    }

    public List<ShiftDefaultMember> getShiftDefaultMembersByShiftId(long shiftId) {
        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new ApiException(ErrorCode.SHIFT_NOT_FOUND));

        return shiftDefaultMemberRepository.findByShift_Id(shift.getId());
    }
    public ShiftDefaultMember createShiftDefaultMember(CreateShiftDefaultMemberRequest request){

        User user =  userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

        Shift shift = shiftRepository.findById(request.getShiftId())
                .orElseThrow(() -> new ApiException(ErrorCode.SHIFT_NOT_FOUND));

        if(shift.getDriver().getId().equals(user.getId())){
            throw new ApiException(ErrorCode.INVALID_SHIFT_TEAM);
        }
        if(!user.getActive()){
            throw new ApiException(ErrorCode.USER_NOT_ACTIVE);
        }
        if(user.getUserRole() == UserRole.DRIVER){
            throw new ApiException(ErrorCode.INVALID_SHIFT_TEAM);
        }

        if(!request.getEndTime().isAfter(request.getStartTime())){
            throw new ApiException(ErrorCode.INVALID_SHIFT_TIME);
        }

        if(!request.getStartTime().isBefore(shift.getEndTime())
                || request.getEndTime().isAfter(shift.getEndTime())){
            throw new ApiException(ErrorCode.INVALID_SHIFT_TIME);
        }

        if (shift.getShiftType() == ShiftType.NIGHT_12H) {
            throw new ApiException(ErrorCode.INVALID_SHIFT_TEAM);
        }

        if(shiftDefaultMemberRepository.existsByShift_IdAndUser_Id(shift.getId(),user.getId())){
            throw new ApiException(ErrorCode.SHIFT_DEFAULT_MEMBER_ALREADY_EXIST);
        }

        ShiftDefaultMember newShiftDefaultMember = new ShiftDefaultMember();
        newShiftDefaultMember.setUser(user);
        newShiftDefaultMember.setShift(shift);
        newShiftDefaultMember.setRole(user.getUserRole());
        newShiftDefaultMember.setStartTime(request.getStartTime());
        newShiftDefaultMember.setEndTime(request.getEndTime());

        return shiftDefaultMemberRepository.save(newShiftDefaultMember);
    }

    public ShiftDefaultMember updateShiftDefaultMemberByUser(
            Long id,
            UpdateShiftDefaultMemberByUserRequest request
    ) {
        ShiftDefaultMember shiftDefaultMemberToUpdate = getShiftDefaultMemberById(id);

        User user = shiftDefaultMemberToUpdate.getUser();
        Shift shift = shiftDefaultMemberToUpdate.getShift();
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

        if (request.getStartTime() != null) {
            startTime = request.getStartTime();
        }

        if (request.getEndTime() != null) {
            endTime = request.getEndTime();
        }

        if (!user.getActive()) {
            throw new ApiException(ErrorCode.USER_NOT_ACTIVE);
        }

        if (user.getUserRole() == UserRole.DRIVER) {
            throw new ApiException(ErrorCode.INVALID_SHIFT_TEAM);
        }

        if (shift.getDriver().getId().equals(user.getId())) {
            throw new ApiException(ErrorCode.INVALID_SHIFT_TEAM);
        }

        if (shift.getShiftType() == ShiftType.NIGHT_12H) {
            throw new ApiException(ErrorCode.INVALID_SHIFT_TEAM);
        }

        if (!endTime.isAfter(startTime)) {
            throw new ApiException(ErrorCode.INVALID_SHIFT_TIME);
        }

        if (startTime.isBefore(shift.getStartTime()) || endTime.isAfter(shift.getEndTime())) {
            throw new ApiException(ErrorCode.INVALID_SHIFT_TIME);
        }

        boolean memberChanged =
                !shiftDefaultMemberToUpdate.getUser().getId().equals(user.getId())
                        || !shiftDefaultMemberToUpdate.getShift().getId().equals(shift.getId());

        if (memberChanged && shiftDefaultMemberRepository.existsByShift_IdAndUser_Id(shift.getId(), user.getId())) {
            throw new ApiException(ErrorCode.SHIFT_DEFAULT_MEMBER_ALREADY_EXIST);
        }

        shiftDefaultMemberToUpdate.setUser(user);
        shiftDefaultMemberToUpdate.setShift(shift);
        shiftDefaultMemberToUpdate.setRole(user.getUserRole());
        shiftDefaultMemberToUpdate.setStartTime(startTime);
        shiftDefaultMemberToUpdate.setEndTime(endTime);

        return shiftDefaultMemberRepository.save(shiftDefaultMemberToUpdate);
    }

    public void deleteShiftDefaultMemberById(long id) {
        ShiftDefaultMember shiftDefaultMember = getShiftDefaultMemberById(id);
        shiftDefaultMemberRepository.delete(shiftDefaultMember);
    }

}
