package pl.jakub.ambulancemanagement.dashboards.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pl.jakub.ambulancemanagement.dashboards.dto.AmbulanceDashboardResponse;
import pl.jakub.ambulancemanagement.exception.ApiException;
import pl.jakub.ambulancemanagement.exception.ErrorCode;
import pl.jakub.ambulancemanagement.shifts.model.Shift;
import pl.jakub.ambulancemanagement.shifts.model.ShiftStatus;
import pl.jakub.ambulancemanagement.shifts.service.ShiftService;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ShiftService shiftService;


    public AmbulanceDashboardResponse getDashboardById(long id) {
        Shift shift = shiftService.getShiftById(id);

        if(shift.getStatus() != ShiftStatus.ACTIVE){
            throw new ApiException(ErrorCode.SHIFT_NOT_ACTIVE);
        }
            return AmbulanceDashboardResponse.fromShift(shift);
    }
}
