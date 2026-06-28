package pl.jakub.ambulancemanagement.ambulances.dto;

import lombok.Getter;
import lombok.Setter;
import pl.jakub.ambulancemanagement.ambulances.model.Ambulance;
import pl.jakub.ambulancemanagement.ambulances.model.AmbulanceStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class AmbulanceResponse {

    private Long id;
    private String carBrand;
    private String model;
    private String registrationPlates;
    private Integer mileage;
    private BigDecimal summerFuelConsumptionNorm;
    private BigDecimal winterFuelConsumptionNorm;
    private BigDecimal tankCapacityLiters;
    private BigDecimal estimatedFuelLiters;
    private LocalDateTime fuelEstimateUpdatedAt;
    private AmbulanceStatus status;
    private Boolean active;

    public static AmbulanceResponse fromEntity(Ambulance ambulance) {
        AmbulanceResponse response = new AmbulanceResponse();

        response.setId(ambulance.getId());
        response.setCarBrand(ambulance.getCarBrand());
        response.setModel(ambulance.getModel());
        response.setRegistrationPlates(ambulance.getRegistrationPlates());
        response.setMileage(ambulance.getMileage());
        response.setSummerFuelConsumptionNorm(ambulance.getSummerFuelConsumptionNorm());
        response.setWinterFuelConsumptionNorm(ambulance.getWinterFuelConsumptionNorm());
        response.setTankCapacityLiters(ambulance.getTankCapacityLiters());
        response.setEstimatedFuelLiters(ambulance.getEstimatedFuelLiters());
        response.setFuelEstimateUpdatedAt(ambulance.getFuelEstimateUpdatedAt());
        response.setStatus(ambulance.getStatus());
        response.setActive(ambulance.getActive());

        return response;
    }
}