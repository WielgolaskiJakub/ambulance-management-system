package pl.jakub.ambulancemanagement.dashboards.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pl.jakub.ambulancemanagement.auth.security.CurrentUserService;
import pl.jakub.ambulancemanagement.dashboards.dto.AmbulanceDashboardResponse;
import pl.jakub.ambulancemanagement.dashboards.dto.ManagerAmbulanceDashboardResponse;
import pl.jakub.ambulancemanagement.exception.ApiException;
import pl.jakub.ambulancemanagement.exception.ErrorCode;
import pl.jakub.ambulancemanagement.routes.model.Route;
import pl.jakub.ambulancemanagement.routes.model.RouteStatus;
import pl.jakub.ambulancemanagement.routes.repository.RouteRepository;
import pl.jakub.ambulancemanagement.shift_default_members.model.ShiftDefaultMember;
import pl.jakub.ambulancemanagement.shift_default_members.repository.ShiftDefaultMemberRepository;
import pl.jakub.ambulancemanagement.shifts.model.Shift;
import pl.jakub.ambulancemanagement.shifts.model.ShiftStatus;
import pl.jakub.ambulancemanagement.shifts.repository.ShiftRepository;
import pl.jakub.ambulancemanagement.shifts.service.ShiftService;
import pl.jakub.ambulancemanagement.users.model.User;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ShiftService shiftService;
    private final ShiftRepository shiftRepository;
    private final CurrentUserService currentUserService;
    private final RouteRepository routeRepository;
    private final ShiftDefaultMemberRepository shiftDefaultMemberRepository;

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

    public List<ManagerAmbulanceDashboardResponse> getDashboardByManager() {

        LocalDateTime now =  LocalDateTime.now();

        return shiftRepository.findByStatusOrderByAmbulance_RegistrationPlatesAsc(
                ShiftStatus.ACTIVE)
                .stream()
                .map(shift -> { Route currentRoute =
                        routeRepository.findFirstByShift_IdAndStatusInOrderByStartedAtDesc(shift.getId(),
                              List.of(RouteStatus.IN_PROGRESS,
                                      RouteStatus.WAITING)
                        ).orElse(null);

                    List<ShiftDefaultMember> crew = shiftDefaultMemberRepository
                            .findActiveMembersForShiftAt(
                                    shift.getId()
                                    , now
                            );

                    return ManagerAmbulanceDashboardResponse.from(
                            shift, crew, currentRoute
                    );
                }).toList();
    }
}
