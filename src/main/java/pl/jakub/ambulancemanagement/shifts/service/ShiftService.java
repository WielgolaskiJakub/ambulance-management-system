package pl.jakub.ambulancemanagement.shifts.service;

import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pl.jakub.ambulancemanagement.ambulances.model.Ambulance;
import pl.jakub.ambulancemanagement.ambulances.model.AmbulanceStatus;
import pl.jakub.ambulancemanagement.ambulances.repository.AmbulanceRepository;
import pl.jakub.ambulancemanagement.exception.ApiException;
import pl.jakub.ambulancemanagement.exception.ErrorCode;
import pl.jakub.ambulancemanagement.shifts.dto.ShiftCreateRequest;
import pl.jakub.ambulancemanagement.shifts.dto.ShiftUpdateByUserRequest;
import pl.jakub.ambulancemanagement.shifts.model.Shift;
import pl.jakub.ambulancemanagement.shifts.model.ShiftStatus;
import pl.jakub.ambulancemanagement.shifts.model.ShiftType;
import pl.jakub.ambulancemanagement.shifts.repository.ShiftRepository;
import pl.jakub.ambulancemanagement.users.model.UserRole;
import pl.jakub.ambulancemanagement.users.model.User;
import pl.jakub.ambulancemanagement.users.repository.UserRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;


@Service
@RequiredArgsConstructor
public class ShiftService {

    private final ShiftRepository shiftRepository;
    private final UserRepository userRepository;
    private final AmbulanceRepository ambulanceRepository;

    public List<Shift> getAllShifts() {
        return shiftRepository.findAll();
    }


    public Shift getShiftById(long id) {
        return shiftRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.SHIFT_NOT_FOUND));
    }

    @Transactional
    public Shift createShift(ShiftCreateRequest request) {

        LocalDateTime startTime;
        LocalDateTime endTime;

        if(request.getShiftType() == ShiftType.OTHER){
            if(request.getStartTime() == null || request.getEndTime() == null){
                throw new ApiException(ErrorCode.SHIFT_TIME_REQUIRED);
            }
            startTime = request.getStartTime();
            endTime = request.getEndTime();
        } else {
            if (request.getShiftDate() == null) {
            throw new ApiException(ErrorCode.SHIFT_DATE_REQUIRED);
            }

            startTime = calculateStartTime(request.getShiftDate(), request.getShiftType());
            endTime = calculateEndTime(request.getShiftDate(), request.getShiftType());
            }

        if (!endTime.isAfter(startTime)) {
            throw new ApiException(ErrorCode.INVALID_SHIFT_TIME);
        }

        User driver = userRepository.findById(request.getDriverId())
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

        if (driver.getUserRole() != UserRole.DRIVER) {
            throw new ApiException(ErrorCode.INVALID_DRIVER_ROLE);
        }
        if (!driver.getActive()) {
            throw new ApiException(ErrorCode.USER_NOT_ACTIVE);
        }
        Ambulance ambulance = ambulanceRepository.findById(request.getAmbulanceId())
                .orElseThrow(() -> new ApiException(ErrorCode.AMBULANCE_NOT_FOUND));

        if (!ambulance.getActive()) {
            throw new ApiException(ErrorCode.AMBULANCE_NOT_ACTIVE);
        }

        if (ambulance.getStatus() != AmbulanceStatus.AVAILABLE) {
            throw new ApiException(ErrorCode.AMBULANCE_NOT_AVAILABLE);
        }


        User createdBy = userRepository.findById(request.getCreatedById())
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

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
        shift.setCreatedBy(createdBy);
        shift.setStartTime(startTime);
        shift.setEndTime(endTime);
        shift.setStatus(ShiftStatus.ACTIVE);

        ambulance.setStatus(AmbulanceStatus.IN_USE);
        ambulanceRepository.save(ambulance);

        return shiftRepository.save(shift);
    }

    @Transactional
    public Shift updateShiftByUser(long id, ShiftUpdateByUserRequest request) {


        Shift shiftToUpdate = getShiftById(id);

        if (shiftToUpdate.getStatus() != ShiftStatus.ACTIVE) {
            throw new ApiException(ErrorCode.SHIFT_NOT_ACTIVE);
        }

        if (request.getAmbulanceId() != null) {
            Long currentAmbulanceId = shiftToUpdate.getAmbulance().getId();

            if (!currentAmbulanceId.equals(request.getAmbulanceId())) {
                Ambulance newAmbulance = ambulanceRepository.findById(request.getAmbulanceId())
                        .orElseThrow(() -> new ApiException(ErrorCode.AMBULANCE_NOT_FOUND));

                if (!newAmbulance.getActive()) {
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
                if (request.getStartTime() == null || request.getEndTime() == null) {
                    throw new ApiException(ErrorCode.SHIFT_TIME_REQUIRED);
                }

                startTime = request.getStartTime();
                endTime = request.getEndTime();

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

            shiftToUpdate.setShiftType(newShiftType);
            shiftToUpdate.setStartTime(startTime);
            shiftToUpdate.setEndTime(endTime);
        }
        return shiftRepository.save(shiftToUpdate);
    }

    @Transactional
    public Shift finishShift(long id) {
        Shift shift = getShiftById(id);
        if (shift.getStatus() != ShiftStatus.ACTIVE) {
            throw new ApiException(ErrorCode.SHIFT_NOT_ACTIVE);
        }
        shift.setStatus(ShiftStatus.FINISHED);
        shift.getAmbulance().setStatus(AmbulanceStatus.AVAILABLE);
        return shiftRepository.save(shift);
    }

    @Transactional
    public Shift cancelShiftById(long id) {
        Shift shift = getShiftById(id);

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
}



