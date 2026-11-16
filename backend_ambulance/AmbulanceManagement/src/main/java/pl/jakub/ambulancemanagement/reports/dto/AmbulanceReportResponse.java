package pl.jakub.ambulancemanagement.reports.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AmbulanceReportResponse(

         Long ambulanceId,
         String registrationPlates,
         LocalDate dateFrom,
         LocalDate dateTo,
         long totalDistanceKm,
         int completedRoutesCount,
         BigDecimal totalEstimatedFuelConsumptionLiters

){}

