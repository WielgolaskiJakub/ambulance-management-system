package pl.jakub.ambulancemanagement.recovery.dto;

import pl.jakub.ambulancemanagement.routes.model.Route;

import java.time.LocalDateTime;

public record RecoveryRouteSummaryResponse(

        Long routeId,
        String registrationPlates,
        String driverFullName,
        LocalDateTime startedAt
) {

    public static RecoveryRouteSummaryResponse fromEntity(Route route){
        var shift = route.getShift();
        var driver = shift.getDriver();

        return new RecoveryRouteSummaryResponse(
                route.getId(),
                shift.getAmbulance().getRegistrationPlates(),
                driver.getFirstName() + " " + driver.getLastName(),
                route.getStartedAt()
        );
    }
}
