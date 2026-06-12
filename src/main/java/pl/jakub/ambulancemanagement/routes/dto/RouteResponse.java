package pl.jakub.ambulancemanagement.routes.dto;

import pl.jakub.ambulancemanagement.routes.model.Route;
import pl.jakub.ambulancemanagement.routes.model.RouteStatus;

import java.time.LocalDateTime;
import java.util.List;

public record RouteResponse(
        Long id,
        List<Long> transportOrderIds,
        Long shiftId,
        String startAddress,
        String actualDestinationAddress,
        Integer distanceKm,
        LocalDateTime startedAt,
        LocalDateTime finishedAt,
        String notes,
        RouteStatus status
) {


    public static RouteResponse fromEntity(Route route) {
        List<Long> transportOrderIds =
                route.getRouteOrders() == null
                        ? List.of()
                        : route.getRouteOrders()
                        .stream()
                        .map(routeOrder -> routeOrder.getTransportOrder().getId())
                        .toList();
        return new RouteResponse(
                route.getId(),
                transportOrderIds,
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
