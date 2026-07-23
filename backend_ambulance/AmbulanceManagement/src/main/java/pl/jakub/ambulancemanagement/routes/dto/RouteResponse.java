package pl.jakub.ambulancemanagement.routes.dto;

import pl.jakub.ambulancemanagement.routes.model.Route;
import pl.jakub.ambulancemanagement.routes.model.RouteStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record RouteResponse(
        Long id,
        List<RouteTransportOrderReferenceResponse> transportOrders,
        Long shiftId,
        String startAddress,
        String actualDestinationAddress,
        Integer distanceKm,
        LocalDateTime startedAt,
        LocalDateTime finishedAt,
        String notes,
        RouteStatus status,
        BigDecimal fuelConsumptionNormUsed,
        BigDecimal estimatedFuelConsumedLiters
) {


    public static RouteResponse fromEntity(Route route) {
        List<RouteTransportOrderReferenceResponse> transportOrders =
                route.getRouteOrders() == null
                        ? List.of()
                        : route.getRouteOrders()
                        .stream()
                        .map(RouteTransportOrderReferenceResponse::fromEntity)
                        .toList();
        return new RouteResponse(
                route.getId(),
                transportOrders,
                route.getShift().getId(),
                route.getStartAddress(),
                route.getActualDestinationAddress(),
                route.getDistanceKm(),
                route.getStartedAt(),
                route.getFinishedAt(),
                route.getNotes(),
                route.getStatus(),
                route.getFuelConsumptionNormUsed(),
                route.getEstimatedFuelConsumedLiters()
        );
    }
}
