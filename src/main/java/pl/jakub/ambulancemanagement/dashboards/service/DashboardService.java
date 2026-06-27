package pl.jakub.ambulancemanagement.dashboards.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pl.jakub.ambulancemanagement.auth.security.CurrentUserService;
import pl.jakub.ambulancemanagement.dashboards.dto.AmbulanceDashboardResponse;
import pl.jakub.ambulancemanagement.exception.ApiException;
import pl.jakub.ambulancemanagement.exception.ErrorCode;
import pl.jakub.ambulancemanagement.shifts.model.Shift;
import pl.jakub.ambulancemanagement.shifts.model.ShiftStatus;
import pl.jakub.ambulancemanagement.shifts.repository.ShiftRepository;
import pl.jakub.ambulancemanagement.shifts.service.ShiftService;
import pl.jakub.ambulancemanagement.users.model.User;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ShiftService shiftService;
    private final ShiftRepository shiftRepository;
    private final CurrentUserService currentUserService;

    public AmbulanceDashboardResponse getMyDashboard() {
        User currentUser = currentUserService.getCurrentUser();

        Shift shift = shiftRepository.findByDriver_IdAndStatus(
                currentUser.getId(),
                ShiftStatus.ACTIVE)
                .orElseThrow(() -> new ApiException(ErrorCode.SHIFT_NOT_ACTIVE));

            return AmbulanceDashboardResponse.fromShift(shift, currentUser);
    }

    public AmbulanceDashboardResponse getDashboardByShiftIdForAdmin(long shiftId) {
        Shift shift = shiftService.getShiftById(shiftId);

        if(shift.getStatus() != ShiftStatus.ACTIVE) {
            throw new ApiException(ErrorCode.SHIFT_NOT_ACTIVE);
        }

        return AmbulanceDashboardResponse.fromShift(shift, shift.getDriver());
    }
}
