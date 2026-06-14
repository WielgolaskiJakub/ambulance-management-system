package pl.jakub.ambulancemanagement.routes.dto;

import pl.jakub.ambulancemanagement.routes.model.Route;
import pl.jakub.ambulancemanagement.routes.model.RouteStatus;


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
        List<RouteTransportOrderSummaryResponse> transportOrders
) {
    public static RouteDetailsResponse fromEntity(Route route, List<RouteTransportOrderSummaryResponse> transportOrders){
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
                transportOrders
        );
    }
}
