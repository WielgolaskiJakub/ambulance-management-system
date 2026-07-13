package pl.jakub.ambulancemanagement.dashboards.dto;

import pl.jakub.ambulancemanagement.routes.model.Route;
import pl.jakub.ambulancemanagement.routes.model.RouteStatus;
import pl.jakub.ambulancemanagement.shift_default_members.model.ShiftDefaultMember;
import pl.jakub.ambulancemanagement.shifts.model.Shift;

import java.time.LocalDateTime;
import java.util.List;

public record ManagerAmbulanceDashboardResponse(

        Long shiftId,
        Long ambulanceId,
        String registrationPlates,
        String carBrand,
        String model,
        String driverFullName,
        List<String> crewMemberFullNames,
        RouteStatus currentRouteStatus,
        LocalDateTime routeStartedAt,
        String routeStartAddress,
        String routeDestinationAddress
) {
    public static ManagerAmbulanceDashboardResponse from(
            Shift shift,
            List<ShiftDefaultMember> crew,
            Route currentRoute) {
        return new ManagerAmbulanceDashboardResponse(
                shift.getId(),
                shift.getAmbulance().getId(),
                shift.getAmbulance().getRegistrationPlates(),
                shift.getAmbulance().getCarBrand(),
                shift.getAmbulance().getModel(),
                shift.getDriver().getFirstName() + " " + shift.getDriver().getLastName(),
                crew.stream()
                        .map(member ->
                                member.getUser().getFirstName()
                                        + " "
                                        + member.getUser().getLastName())
                        .toList(),
                currentRoute == null ? null : currentRoute.getStatus(),
                currentRoute == null ? null : currentRoute.getStartedAt(),
                currentRoute == null ? null : currentRoute.getStartAddress(),
                currentRoute == null ? null : currentRoute.getActualDestinationAddress()
        );
    }
}
