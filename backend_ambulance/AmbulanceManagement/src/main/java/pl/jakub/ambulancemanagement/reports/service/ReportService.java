package pl.jakub.ambulancemanagement.reports.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pl.jakub.ambulancemanagement.ambulances.model.Ambulance;
import pl.jakub.ambulancemanagement.ambulances.repository.AmbulanceRepository;
import pl.jakub.ambulancemanagement.exception.ApiException;
import pl.jakub.ambulancemanagement.exception.ErrorCode;
import pl.jakub.ambulancemanagement.reports.dto.AmbulanceReportResponse;
import pl.jakub.ambulancemanagement.reports.dto.AmbulanceReportSummaryResponse;
import pl.jakub.ambulancemanagement.reports.dto.ReportCreateRequest;
import pl.jakub.ambulancemanagement.routes.model.Route;
import pl.jakub.ambulancemanagement.routes.model.RouteStatus;
import pl.jakub.ambulancemanagement.routes.repository.RouteRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor

public class ReportService {

    private final RouteRepository routeRepository;
    private final AmbulanceRepository ambulanceRepository;

    public AmbulanceReportSummaryResponse getReport(ReportCreateRequest request){

        if(request.dateFrom().isAfter(request.dateTo())){
            throw new ApiException(ErrorCode.INVALID_DATE_TIME);
        }

        LocalDateTime startedAtFrom = request.dateFrom().atStartOfDay();
        LocalDateTime startedAtToExclusive = request.dateTo().plusDays(1).atStartOfDay();

        Set<Long> ambulanceIds = new HashSet<>(request.ambulanceIds());

        List<Ambulance> ambulances = ambulanceRepository.findAllById(ambulanceIds);

        if(ambulanceIds.size() != ambulances.size()){
            throw new ApiException(ErrorCode.AMBULANCE_NOT_FOUND);
        }

        List<AmbulanceReportResponse> reports = new ArrayList<>();

        for(Ambulance ambulance : ambulances){

            List<Route> routes = routeRepository.findRouteByStartedAtGreaterThanEqualAndStartedAtLessThanAndStatusInAndShift_Ambulance_Id(
                    startedAtFrom,
                    startedAtToExclusive,
                    List.of(RouteStatus.COMPLETED),
                    ambulance.getId());

            int completedRoutesCount = routes.size();
            long totalDistanceKm = 0;
            BigDecimal totalEstimatedFuelConsumptionLiters = BigDecimal.ZERO;

            for(Route route : routes){
                totalDistanceKm += route.getDistanceKm();
                totalEstimatedFuelConsumptionLiters = totalEstimatedFuelConsumptionLiters
                        .add(route.getEstimatedFuelConsumedLiters());
            }

            reports.add(new AmbulanceReportResponse(
                    ambulance.getId(),
                    ambulance.getRegistrationPlates(),
                    request.dateFrom(),
                    request.dateTo(),
                    totalDistanceKm,
                    completedRoutesCount,
                    totalEstimatedFuelConsumptionLiters));
        }

        long allAmbulancesDistanceKm = 0;
        int allAmbulancesCompletedRoutesCount = 0;
        BigDecimal allAmbulancesFuelLiters = BigDecimal.ZERO;

        for(AmbulanceReportResponse report: reports){
            allAmbulancesDistanceKm += report.totalDistanceKm();
            allAmbulancesCompletedRoutesCount += report.completedRoutesCount();
            allAmbulancesFuelLiters = allAmbulancesFuelLiters.add(report.totalEstimatedFuelConsumptionLiters());
        }

        return new AmbulanceReportSummaryResponse(
                reports,
                allAmbulancesDistanceKm,
                allAmbulancesCompletedRoutesCount,
                allAmbulancesFuelLiters);
    }


}
