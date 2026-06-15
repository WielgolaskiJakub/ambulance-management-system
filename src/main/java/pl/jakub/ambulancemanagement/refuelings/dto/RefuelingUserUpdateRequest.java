package pl.jakub.ambulancemanagement.refuelings.dto;


import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

public class RefuelingUserUpdateRequest {

    private Integer liters;

    private Integer mileageAtRefueling;

    private String driverNotes;
}
