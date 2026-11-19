package pl.jakub.ambulancemanagement.recovery.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.jakub.ambulancemanagement.ambulances.model.Ambulance;
import pl.jakub.ambulancemanagement.ambulances.service.AmbulanceService;
import pl.jakub.ambulancemanagement.audit.model.AuditAction;
import pl.jakub.ambulancemanagement.audit.model.AuditEntityType;
import pl.jakub.ambulancemanagement.audit.service.AuditService;
import pl.jakub.ambulancemanagement.exception.ApiException;
import pl.jakub.ambulancemanagement.exception.ErrorCode;
import pl.jakub.ambulancemanagement.recovery.dto.RecoverActiveShiftRequest;
import pl.jakub.ambulancemanagement.recovery.dto.RestoreAmbulanceStateRequest;
import pl.jakub.ambulancemanagement.shifts.model.Shift;
import pl.jakub.ambulancemanagement.shifts.model.ShiftType;
import pl.jakub.ambulancemanagement.shifts.service.ShiftService;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RecoveryService {

    private final AmbulanceService ambulanceService;
    private final AuditService auditService;
    private final ShiftService shiftService;

    @Transactional
    public void restoreAmbulanceState(RestoreAmbulanceStateRequest request, Long id) {

        Ambulance ambulance = ambulanceService.getAmbulanceById(id);

        if (request.estimatedFuelLiters().compareTo(ambulance.getTankCapacityLiters()) > 0) {
            throw new ApiException(ErrorCode.INVALID_RECOVERY_ESTIMATED_FUEL_REQUEST);
        }
        if (request.mileage() < ambulance.getMileage()) {
            throw new ApiException(ErrorCode.INVALID_RECOVERY_MILEAGE_REQUEST);
        }

        Map<String, Object> details = new HashMap<>();
        details.put("registrationPlates", ambulance.getRegistrationPlates());
        details.put("previousMileage", ambulance.getMileage());
        details.put("newMileage", request.mileage());
        details.put("previousEstimatedFuelLiters", ambulance.getEstimatedFuelLiters());
        details.put("newEstimatedFuelLiters", request.estimatedFuelLiters());

        ambulance.setMileage(request.mileage());
        ambulance.setEstimatedFuelLiters(request.estimatedFuelLiters());
        ambulance.setFuelEstimateUpdatedAt(LocalDateTime.now());

        auditService.record(
                AuditAction.AMBULANCE_STATE_RESTORED,
                AuditEntityType.AMBULANCE,
                ambulance.getId(),
                details,
                request.reason().trim()
        );
    }

    @Transactional
    public void recoverActiveShift(RecoverActiveShiftRequest request) {


    }
}