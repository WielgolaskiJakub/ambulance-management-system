package pl.jakub.ambulancemanagement.reports.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record DriverReportResponse(
        Long driverId,
        String driverFullName,
        LocalDate dateFrom,
        LocalDate dateTo,
        List<RouteReportResponse> routes,
        int totalRoutesCount,
        int completedRoutesCount,
        int unsettledRoutesCount,
        long totalDistanceKm,
        BigDecimal totalEstimatedFuelConsumptionLiters
) {}
