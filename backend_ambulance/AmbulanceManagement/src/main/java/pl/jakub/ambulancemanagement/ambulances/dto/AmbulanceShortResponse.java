package pl.jakub.ambulancemanagement.ambulances.dto;

import lombok.Builder;
import lombok.Getter;
import pl.jakub.ambulancemanagement.ambulances.model.Ambulance;

@Getter
@Builder
public class AmbulanceShortResponse {

    private Long id;
    private String registrationPlates;
    private String carBrand;
    private String model;
    private Integer mileage;

    public static AmbulanceShortResponse fromEntity(Ambulance ambulance) {
        return AmbulanceShortResponse.builder()
                .id(ambulance.getId())
                .registrationPlates(ambulance.getRegistrationPlates())
                .carBrand(ambulance.getCarBrand())
                .model(ambulance.getModel())
                .mileage(ambulance.getMileage())
                .build();
    }
}