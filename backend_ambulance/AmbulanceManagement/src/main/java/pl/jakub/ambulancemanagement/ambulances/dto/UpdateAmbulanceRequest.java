package pl.jakub.ambulancemanagement.ambulances.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class UpdateAmbulanceRequest {

    private String carBrand;

    private String model;

    private String registrationPlates;

    @PositiveOrZero
    private Integer mileage;

    @DecimalMin(value = "0.01")
    private BigDecimal summerFuelConsumptionNorm;

    @DecimalMin(value = "0.01")
    private BigDecimal winterFuelConsumptionNorm;

    @DecimalMin(value = "0.01")
    private BigDecimal tankCapacityLiters;
}
