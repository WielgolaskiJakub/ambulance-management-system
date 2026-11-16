package pl.jakub.ambulancemanagement.reports.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;


public record DriverReportRequest (

        @NotNull
        @Positive
        Long driverId,

        @NotNull
        LocalDate dateFrom,

        @NotNull
        LocalDate dateTo

){}
