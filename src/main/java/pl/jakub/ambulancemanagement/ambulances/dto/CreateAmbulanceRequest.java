package pl.jakub.ambulancemanagement.ambulances.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;
import pl.jakub.ambulancemanagement.ambulances.model.AmbulanceStatus;

import java.math.BigDecimal;

@Getter
@Setter
public class CreateAmbulanceRequest {

    @NotBlank
    private String carBrand;

    @NotBlank
    private String model;

    @NotBlank
    private String registrationPlates;

    @NotNull
    @PositiveOrZero
    private Integer mileage;

    @NotNull
    @DecimalMin(value = "0.01")
    private BigDecimal summerFuelConsumptionNorm;

    @NotNull
    @DecimalMin(value = "0.01")
    private BigDecimal winterFuelConsumptionNorm;

    @NotNull
    @DecimalMin(value = "0.01")
    private BigDecimal tankCapacityLiters;
}
