package pl.jakub.ambulancemanagement.ambulances.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import pl.jakub.ambulancemanagement.ambulances.model.Ambulance;
import pl.jakub.ambulancemanagement.ambulances.model.AmbulanceStatus;

import java.math.BigDecimal;

@Getter
@AllArgsConstructor
public class AmbulanceResponse {
    private Long id;
    private String carBrand;
    private String model;
    private String registrationPlates;
    private Integer mileage;
    private BigDecimal summerFuelConsumptionNorm;
    private BigDecimal winterFuelConsumptionNorm;
    private BigDecimal tankCapacityLiters;
    private AmbulanceStatus status;
    private Boolean active;

    public static AmbulanceResponse fromEntity(Ambulance ambulance) {
        return new AmbulanceResponse(
                ambulance.getId(),
                ambulance.getCarBrand(),
                ambulance.getModel(),
                ambulance.getRegistrationPlates(),
                ambulance.getMileage(),
                ambulance.getSummerFuelConsumptionNorm(),
                ambulance.getWinterFuelConsumptionNorm(),
                ambulance.getTankCapacityLiters(),
                ambulance.getStatus(),
                ambulance.getActive()
        );
    }
}
