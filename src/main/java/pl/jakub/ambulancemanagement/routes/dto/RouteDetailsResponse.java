package pl.jakub.ambulancemanagement.routes.dto;

import pl.jakub.ambulancemanagement.route_members.dto.RouteMemberResponse;
import pl.jakub.ambulancemanagement.routes.model.Route;
import pl.jakub.ambulancemanagement.routes.model.RouteStatus;


import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record RouteDetailsResponse(
        Long id,
        Long shiftId,
        String startAddress,
        String actualDestinationAddress,
        Integer distanceKm,
        LocalDateTime startedAt,
        LocalDateTime finishedAt,
        String notes,
        RouteStatus status,
        BigDecimal fuelConsumptionNormUsed,
        BigDecimal estimatedFuelConsumedLiters,
        Integer startOdometerKm,
        Integer finishOdometerKm,
        List<RouteTransportOrderSummaryResponse> transportOrders,
        List<RouteMemberResponse> routeMembers
) {
    public static RouteDetailsResponse fromEntity(Route route,
                                                  List<RouteTransportOrderSummaryResponse> transportOrders,
                                                  List<RouteMemberResponse> routeMembers) {
        return new RouteDetailsResponse(
                route.getId(),
                route.getShift().getId(),
                route.getStartAddress(),
                route.getActualDestinationAddress(),
                route.getDistanceKm(),
                route.getStartedAt(),
                route.getFinishedAt(),
                route.getNotes(),
                route.getStatus(),
                route.getFuelConsumptionNormUsed(),
                route.getEstimatedFuelConsumedLiters(),
                route.getStartOdometerKm(),
                route.getFinishOdometerKm(),
                transportOrders,
                routeMembers
        );
    }
}
