package pl.jakub.ambulancemanagement.refuelings.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RefuelingCreateRequest {

    @NotNull
    private Long driverId;

    @NotNull
    private Long shiftId;

    @NotNull
    private Long ambulanceId;

    @NotNull
    @Positive
    private Integer liters;

    @NotNull
    @PositiveOrZero
    private Integer mileageAtRefueling;

    private String driverNotes;
}


// TODO JWT DRIVER ID, AMBULANCE POBIERAMY Z DRIVER ACTIVE SHIFT GET ID.