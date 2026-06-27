package pl.jakub.ambulancemanagement.refuelings.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;
import pl.jakub.ambulancemanagement.refuelings.model.RefuelingStatus;

import java.math.BigDecimal;

@Getter
@Setter
public class RefuelingManagerUpdateRequest {

    private String invoiceNumber;

    @PositiveOrZero
    private BigDecimal totalCost;

    @NotNull
    private RefuelingStatus status;

    private String managerNotes;
}