package pl.jakub.ambulancemanagement.reports.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AmbulanceReportResponse(

         Long ambulanceId,
         String registrationPlates,
         LocalDate dateFrom,
         LocalDate dateTo,
         Integer firstStartOdometerKm,
         Integer lastFinishOdometerKm,
         long totalDistanceKm,
         int completedRoutesCount,
         BigDecimal totalEstimatedFuelConsumptionLiters

){}

