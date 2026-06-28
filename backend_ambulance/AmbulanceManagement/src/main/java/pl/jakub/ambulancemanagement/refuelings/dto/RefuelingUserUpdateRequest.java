package pl.jakub.ambulancemanagement.refuelings.dto;


import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

public class RefuelingUserUpdateRequest {

    @Min(value = 0, message = "Ilość litrów musi być większa od 0")
    private Integer liters;

    @Min(value = 0, message = "Przebieg nie może być ujemny")
    private Integer mileageAtRefueling;

    private String driverNotes;
}
