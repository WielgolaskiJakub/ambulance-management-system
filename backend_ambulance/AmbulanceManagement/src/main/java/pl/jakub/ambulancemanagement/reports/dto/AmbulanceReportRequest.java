package pl.jakub.ambulancemanagement.reports.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;
import java.util.List;

public record AmbulanceReportRequest(

        @NotEmpty
        List<@NotNull @Positive Long> ambulanceIds,

        @NotNull
        LocalDate dateFrom,

        @NotNull
        LocalDate dateTo

) {}
