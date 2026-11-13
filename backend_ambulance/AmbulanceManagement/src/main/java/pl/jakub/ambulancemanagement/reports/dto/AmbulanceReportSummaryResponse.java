package pl.jakub.ambulancemanagement.reports.dto;

import java.math.BigDecimal;
import java.util.List;

public record AmbulanceReportSummaryResponse(

        List<AmbulanceReportResponse> ambulances,
        long allTotalDistanceKm,
        int allCompletedRoutesCount,
        BigDecimal allTotalEstimatedFuelConsumptionLiters
) { }
