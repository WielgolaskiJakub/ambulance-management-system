package pl.jakub.ambulancemanagement.dashboards.dto;

import lombok.Getter;
import lombok.Setter;
import pl.jakub.ambulancemanagement.ambulances.model.Ambulance;
import pl.jakub.ambulancemanagement.users.model.UserRole;
import pl.jakub.ambulancemanagement.shifts.model.Shift;
import pl.jakub.ambulancemanagement.shifts.model.ShiftStatus;
import pl.jakub.ambulancemanagement.users.model.User;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
public class AmbulanceDashboardResponse {

    private Long shiftId;
    private ShiftStatus shiftStatus;
    private LocalDateTime shiftStartTime;
    private LocalDateTime shiftEndTime;
    private String shiftTimeLabel;

    private LocalDate currentDate;

    private Long loggedUserId;
    private String loggedUserFullName;
    private UserRole loggedUserRole;

    private Long ambulanceId;
    private String registrationPlates;
    private String carBrand;
    private String model;

    private Integer mileage;

    private BigDecimal estimatedFuelLiters;
    private Integer estimatedFuelLitersDisplay;
    private BigDecimal tankCapacityLiters;
    private LocalDateTime fuelEstimateUpdatedAt;

    public static AmbulanceDashboardResponse fromShift(Shift shift, User loggedUser) {
        Ambulance ambulance = shift.getAmbulance();


        AmbulanceDashboardResponse response = new AmbulanceDashboardResponse();

        response.setShiftId(shift.getId());
        response.setShiftStatus(shift.getStatus());
        response.setShiftStartTime(shift.getStartTime());
        response.setShiftEndTime(shift.getEndTime());
        response.setShiftTimeLabel(buildShiftTimeLabel(shift));

        response.setCurrentDate(LocalDate.now());

        response.setLoggedUserId(loggedUser.getId());
        response.setLoggedUserFullName(loggedUser.getFirstName() + " " + loggedUser.getLastName());
        response.setLoggedUserRole(loggedUser.getUserRole());

        response.setAmbulanceId(ambulance.getId());
        response.setRegistrationPlates(ambulance.getRegistrationPlates());
        response.setCarBrand(ambulance.getCarBrand());
        response.setModel(ambulance.getModel());

        response.setMileage(ambulance.getMileage());

        response.setEstimatedFuelLiters(ambulance.getEstimatedFuelLiters());
        response.setEstimatedFuelLitersDisplay(toDisplayLiters(ambulance.getEstimatedFuelLiters()));
        response.setTankCapacityLiters(ambulance.getTankCapacityLiters());
        response.setFuelEstimateUpdatedAt(ambulance.getFuelEstimateUpdatedAt());

        return response;
    }

    private static Integer toDisplayLiters(BigDecimal estimatedFuelLiters) {
        if (estimatedFuelLiters == null) {
            return null;
        }

        return estimatedFuelLiters
                .setScale(0, RoundingMode.DOWN)
                .intValue();
    }

    private static String buildShiftTimeLabel(Shift shift) {
        if (shift.getStartTime() == null || shift.getEndTime() == null) {
            return null;
        }

        LocalTime start = shift.getStartTime().toLocalTime();
        LocalTime end = shift.getEndTime().toLocalTime();

        return start.getHour() + "-" + end.getHour();
    }
}