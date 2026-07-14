package pl.jakub.ambulancemanagement.shifts.service;

import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pl.jakub.ambulancemanagement.ambulances.model.Ambulance;
import pl.jakub.ambulancemanagement.ambulances.model.AmbulanceStatus;
import pl.jakub.ambulancemanagement.ambulances.repository.AmbulanceRepository;
import pl.jakub.ambulancemanagement.auth.security.CurrentUserService;
import pl.jakub.ambulancemanagement.exception.ApiException;
import pl.jakub.ambulancemanagement.exception.ErrorCode;
import pl.jakub.ambulancemanagement.route_members.model.RouteMemberRole;
import pl.jakub.ambulancemanagement.routes.model.RouteStatus;
import pl.jakub.ambulancemanagement.routes.repository.RouteRepository;
import pl.jakub.ambulancemanagement.shift_default_members.model.ShiftDefaultMember;
import pl.jakub.ambulancemanagement.shift_default_members.repository.ShiftDefaultMemberRepository;
import pl.jakub.ambulancemanagement.shift_default_members.service.ShiftDefaultMemberService;
import pl.jakub.ambulancemanagement.shifts.dto.ShiftCreateRequest;
import pl.jakub.ambulancemanagement.shifts.dto.ShiftDefaultMemberCreateRequest;
import pl.jakub.ambulancemanagement.shifts.dto.ShiftUpdateByUserRequest;
import pl.jakub.ambulancemanagement.shifts.model.Shift;
import pl.jakub.ambulancemanagement.shifts.model.ShiftStatus;
import pl.jakub.ambulancemanagement.shifts.model.ShiftType;
import pl.jakub.ambulancemanagement.shifts.repository.ShiftRepository;
import pl.jakub.ambulancemanagement.users.model.UserRole;
import pl.jakub.ambulancemanagement.users.model.User;
import pl.jakub.ambulancemanagement.users.repository.UserRepository;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;


@Service
@RequiredArgsConstructor
public class ShiftService {

    private final ShiftRepository shiftRepository;
    private final AmbulanceRepository ambulanceRepository;
    private final CurrentUserService currentUserService;
    private final RouteRepository routeRepository;
    private final ShiftDefaultMemberRepository shiftDefaultMemberRepository;
    private final UserRepository userRepository;
    private final ShiftDefaultMemberService shiftDefaultMemberService;

    public List<Shift> getAllShifts() {
        return shiftRepository.findAll();
    }


    public Shift getShiftById(Long id) {
        return shiftRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.SHIFT_NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public List<Shift> getMyShifts() {
        User currentUser = currentUserService.getCurrentUser();
        return shiftRepository.findByDriver_IdOrderByStartTimeDesc(currentUser.getId());
    }

    @Transactional(readOnly = true)
    public Shift getMyShiftById(Long shiftId) {
        return getShiftForCurrentDriver(shiftId);
    }

    @Transactional
    public Shift createShift(ShiftCreateRequest request) {

        LocalDateTime startTime;
        LocalDateTime endTime;

        if (request.getShiftType() == ShiftType.OTHER) {
            if (request.getStartTime() == null || request.getEndTime() == null) {
                throw new ApiException(ErrorCode.SHIFT_TIME_REQUIRED);
            }
            startTime = request.getStartTime();
            endTime = request.getEndTime();
        } else {
            LocalDate shiftDate = LocalDate.now();

            startTime = calculateStartTime(shiftDate, request.getShiftType());
            endTime = calculateEndTime(shiftDate, request.getShiftType());
        }

        if (!endTime.isAfter(startTime)) {
            throw new ApiException(ErrorCode.INVALID_SHIFT_TIME);
        }

        validateShiftTypeAvailability(request.getShiftType());

        if(!endTime.isAfter(LocalDateTime.now())) {
            throw new ApiException(ErrorCode.SHIFT_END_TIME_IN_PAST);
        }

        User driver = currentUserService.getCurrentUser();

        if (driver.getUserRole() != UserRole.DRIVER) {
            throw new ApiException(ErrorCode.INVALID_DRIVER_ROLE);
        }
        if (!Boolean.TRUE.equals(driver.getActive())) {
            throw new ApiException(ErrorCode.USER_NOT_ACTIVE);
        }
        Ambulance ambulance = ambulanceRepository.findById(request.getAmbulanceId())
                .orElseThrow(() -> new ApiException(ErrorCode.AMBULANCE_NOT_FOUND));

        if (!Boolean.TRUE.equals(ambulance.getActive())) {
            throw new ApiException(ErrorCode.AMBULANCE_NOT_ACTIVE);
        }

        if (ambulance.getStatus() != AmbulanceStatus.AVAILABLE) {
            throw new ApiException(ErrorCode.AMBULANCE_NOT_AVAILABLE);
        }


        if (shiftRepository.existsByDriver_IdAndStatus(driver.getId(), ShiftStatus.ACTIVE)) {
            throw new ApiException(ErrorCode.DRIVER_ALREADY_HAS_ACTIVE_SHIFT);
        }

        if (shiftRepository.existsByAmbulance_IdAndStatus(ambulance.getId(), ShiftStatus.ACTIVE)) {
            throw new ApiException(ErrorCode.AMBULANCE_ALREADY_IN_ACTIVE_SHIFT);
        }

        Shift shift = new Shift();
        shift.setDriver(driver);
        shift.setAmbulance(ambulance);
        shift.setShiftType(request.getShiftType());
        shift.setCreatedBy(driver);
        shift.setStartTime(startTime);
        shift.setEndTime(endTime);
        shift.setStatus(ShiftStatus.ACTIVE);

        ambulance.setStatus(AmbulanceStatus.IN_USE);
        ambulanceRepository.save(ambulance);

       Shift savedShift = shiftRepository.save(shift);

       createDefaultMemberIfPresent(savedShift, request.getDefaultMember());

       return savedShift;
    }

    @Transactional
    public Shift updateShiftByUser(long id, ShiftUpdateByUserRequest request) {


       Shift shiftToUpdate = getShiftForCurrentDriver(id);

        if (shiftToUpdate.getStatus() != ShiftStatus.ACTIVE) {
            throw new ApiException(ErrorCode.SHIFT_NOT_ACTIVE);
        }

        if (request.getAmbulanceId() != null) {
            Long currentAmbulanceId = shiftToUpdate.getAmbulance().getId();

            if (!currentAmbulanceId.equals(request.getAmbulanceId())) {
                Ambulance newAmbulance = ambulanceRepository.findById(request.getAmbulanceId())
                        .orElseThrow(() -> new ApiException(ErrorCode.AMBULANCE_NOT_FOUND));

                if (!Boolean.TRUE.equals(newAmbulance.getActive())) {
                    throw new ApiException(ErrorCode.AMBULANCE_NOT_ACTIVE);
                }

                if (newAmbulance.getStatus() != AmbulanceStatus.AVAILABLE) {
                    throw new ApiException(ErrorCode.AMBULANCE_NOT_AVAILABLE);
                }

                shiftToUpdate.getAmbulance().setStatus(AmbulanceStatus.AVAILABLE);
                newAmbulance.setStatus(AmbulanceStatus.IN_USE);

                shiftToUpdate.setAmbulance(newAmbulance);
            }
        }

        if (request.getShiftType() != null
                || request.getShiftDate() != null
                || request.getStartTime() != null
                || request.getEndTime() != null) {

            ShiftType newShiftType = request.getShiftType() != null
                    ? request.getShiftType()
                    : shiftToUpdate.getShiftType();

            LocalDateTime startTime;
            LocalDateTime endTime;

            if (newShiftType == ShiftType.OTHER) {
              startTime = request.getStartTime() != null
                      ? request.getStartTime()
                      :shiftToUpdate.getStartTime();

              endTime = request.getEndTime() != null
                      ? request.getEndTime()
                      : shiftToUpdate.getEndTime();

              if(startTime == null || endTime == null) {
                  throw new ApiException(ErrorCode.SHIFT_TIME_REQUIRED);
              }

            } else {
                LocalDate shiftDate = request.getShiftDate() != null
                        ? request.getShiftDate()
                        : shiftToUpdate.getStartTime().toLocalDate();

                startTime = calculateStartTime(shiftDate, newShiftType);
                endTime = calculateEndTime(shiftDate, newShiftType);
            }

            if (!endTime.isAfter(startTime)) {
                throw new ApiException(ErrorCode.INVALID_SHIFT_TIME);
            }

            if(!endTime.isAfter(LocalDateTime.now())) {
                throw new ApiException(ErrorCode.SHIFT_END_TIME_IN_PAST);
            }

            shiftToUpdate.setShiftType(newShiftType);
            shiftToUpdate.setStartTime(startTime);
            shiftToUpdate.setEndTime(endTime);
        }
        return shiftRepository.save(shiftToUpdate);
    }

    @Transactional
    public Shift finishShift(long id) {
        Shift shift = getMyShiftById(id);
        if (shift.getStatus() != ShiftStatus.ACTIVE) {
            throw new ApiException(ErrorCode.SHIFT_NOT_ACTIVE);
        }

        boolean hasUnfinishedRoutes = routeRepository.existsByShift_IdAndStatusIn(
                shift.getId(),
                List.of(
                        RouteStatus.CREATED,
                        RouteStatus.IN_PROGRESS,
                        RouteStatus.WAITING
                )
        );

        if(hasUnfinishedRoutes){
            throw new ApiException(ErrorCode.SHIFT_HAS_ACTIVE_ROUTES);
        }

        shift.setStatus(ShiftStatus.FINISHED);
        shift.getAmbulance().setStatus(AmbulanceStatus.AVAILABLE);
        return shiftRepository.save(shift);
    }

    @Transactional
    public Shift cancelShiftById(long id) {
        Shift shift = getMyShiftById(id);

        if (shift.getStatus() == ShiftStatus.FINISHED) {
            throw new ApiException(ErrorCode.SHIFT_ALREADY_FINISHED);
        }
        if (shift.getStatus() == ShiftStatus.CANCELLED) {
            throw new ApiException(ErrorCode.SHIFT_ALREADY_CANCELLED);
        }

        shift.setStatus(ShiftStatus.CANCELLED);
        shift.getAmbulance().setStatus(AmbulanceStatus.AVAILABLE);
        return shiftRepository.save(shift);
    }

    private LocalDateTime calculateStartTime(LocalDate date, ShiftType type) {
        return switch (type) {
            case DAY_12H, FULL_24H -> date.atTime(7, 0);
            case NIGHT_12H -> date.atTime(19, 0);
            case OTHER -> throw new ApiException(ErrorCode.INVALID_SHIFT_TYPE);
        };

    }

    private LocalDateTime calculateEndTime(LocalDate date, ShiftType type) {
        return switch (type) {
            case DAY_12H -> date.atTime(19, 0);
            case NIGHT_12H, FULL_24H -> date.plusDays(1).atTime(7, 0);
            case OTHER -> throw new ApiException(ErrorCode.INVALID_SHIFT_TYPE);
        };
    }

    private Shift getShiftForCurrentDriver(Long shiftId){
        User currentUser = currentUserService.getCurrentUser();

        return shiftRepository.findByIdAndDriver_Id(shiftId, currentUser.getId())
                .orElseThrow(() -> new ApiException(ErrorCode.SHIFT_ACCESS_DENIED));
    }

    private void createDefaultMemberIfPresent(
            Shift shift,
            ShiftDefaultMemberCreateRequest request
    ) {
        if(request == null){
            return;
        }

        User member = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

        if(!Boolean.TRUE.equals(member.getActive())){
            throw new ApiException(ErrorCode.USER_NOT_ACTIVE);
        }

        if(shift.getDriver().getId().equals(member.getId())){
            throw new ApiException(ErrorCode.INVALID_SHIFT_TEAM);
        }

        if(!Boolean.TRUE.equals(member.getCanWorkAsSanitary())){
            throw new ApiException(ErrorCode.SHIFT_DEFAULT_MEMBER_INVALID_ROLE);
        }

        if(request.getStartTime() == null){
            throw new ApiException(ErrorCode.INVALID_SHIFT_TIME);
        }

        if (request.getEndTime() != null
                && !request.getEndTime().isAfter(request.getStartTime())) {
            throw new ApiException(ErrorCode.INVALID_SHIFT_TIME);
        }

        if(request.getEndTime() != null
        && !request.getEndTime().isAfter(LocalDateTime.now())) {
            throw new ApiException(ErrorCode.SHIFT_END_TIME_IN_PAST);
        }

        if(request.getStartTime().isBefore(shift.getStartTime())){
            throw new ApiException(ErrorCode.INVALID_SHIFT_TIME);
        }

        shiftDefaultMemberService.validateNoOverlappingAssignmentOnWorkingDay(
                member,
                request.getStartTime(),
                request.getEndTime(),
                -1L
        );

        ShiftDefaultMember defaultMember = new ShiftDefaultMember();
        defaultMember.setShift(shift);
        defaultMember.setUser(member);
        defaultMember.setRole(RouteMemberRole.SANITARY_WORKER);
        defaultMember.setStartTime(request.getStartTime());
        defaultMember.setEndTime(request.getEndTime());

        shiftDefaultMemberRepository.save(defaultMember);
    }

    private void validateShiftTypeAvailability(ShiftType shiftType){
        if(shiftType == ShiftType.OTHER){
            return;
        }

        LocalTime currentTime =  LocalTime.now();
        LocalTime dayShiftCutoff =LocalTime.of(17,0);

        boolean isStandardShiftWindow = !currentTime.isAfter(dayShiftCutoff);

        if(isStandardShiftWindow
        && (shiftType == ShiftType.DAY_12H
        || shiftType == ShiftType.FULL_24H)){
            return;
        }

        if(!isStandardShiftWindow && shiftType == ShiftType.NIGHT_12H){
            return;
        }

        throw new ApiException(ErrorCode.SHIFT_TYPE_NOT_AVAILABLE_AT_CURRENT_TIME);
    }
}



