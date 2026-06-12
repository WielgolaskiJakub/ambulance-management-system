package pl.jakub.ambulancemanagement.routes.dto;

import pl.jakub.ambulancemanagement.routes.model.Route;
import pl.jakub.ambulancemanagement.routes.model.RouteStatus;

import java.time.LocalDateTime;

public record RouteSummaryResponse(
        Long id,
        Long shiftId,
        String startAddress,
        String actualDestinationAddress,
        Integer distanceKm,
        LocalDateTime startedAt,
        LocalDateTime finishedAt,
        String notes,
        RouteStatus status
) {
    public static RouteSummaryResponse fromEntity(Route route) {
        return new RouteSummaryResponse(
                route.getId(),
                route.getShift().getId(),
                route.getStartAddress(),
                route.getActualDestinationAddress(),
                route.getDistanceKm(),
                route.getStartedAt(),
                route.getFinishedAt(),
                route.getNotes(),
                route.getStatus()
        );
    }
}