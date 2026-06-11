package pl.jakub.ambulancemanagement.ambulances.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "ambulances")
public class Ambulance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(name = "car_brand", nullable = false, length = 100)
    private String carBrand;

    @NotBlank
    @Column(name = "model", nullable = false, length = 100)
    private String model;

    @NotBlank
    @Column(name = "registration_plates", nullable = false, unique = true, length = 20)
    private String registrationPlates;

    @NotNull
    @PositiveOrZero
    @Column(name = "mileage", nullable = false)
    private Integer mileage;

    @NotNull
    @DecimalMin(value = "0.01")
    @Column(name = "summer_fuel_consumption_norm", nullable = false, precision = 5, scale = 2)
    private BigDecimal summerFuelConsumptionNorm;

    @NotNull
    @DecimalMin(value = "0.01")
    @Column(name = "winter_fuel_consumption_norm", nullable = false, precision = 5, scale = 2)
    private BigDecimal winterFuelConsumptionNorm;

    @NotNull
    @DecimalMin(value = "0.01")
    @Column(name = "tank_capacity_liters", nullable = false, precision = 6, scale = 2)
    private BigDecimal tankCapacityLiters;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private AmbulanceStatus status;

    @NotNull
    @Column(name = "active", nullable = false)
    private Boolean active = true;
}