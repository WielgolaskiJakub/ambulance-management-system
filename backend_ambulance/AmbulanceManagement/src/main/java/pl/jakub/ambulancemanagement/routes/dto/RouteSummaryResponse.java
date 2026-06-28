package pl.jakub.ambulancemanagement.routes.dto;

import pl.jakub.ambulancemanagement.route_members.dto.RouteMemberResponse;
import pl.jakub.ambulancemanagement.routes.model.Route;
import pl.jakub.ambulancemanagement.routes.model.RouteStatus;

import java.time.LocalDateTime;
import java.util.List;

public record RouteSummaryResponse(
        Long id,
        Long shiftId,
        String startAddress,
        String actualDestinationAddress,
        Integer distanceKm,
        LocalDateTime startedAt,
        LocalDateTime finishedAt,
        String notes,
        RouteStatus status,
        List<RouteMemberResponse> routeMembers
) {
    public static RouteSummaryResponse fromEntity(Route route,
                                                  List<RouteMemberResponse> members) {
        return new RouteSummaryResponse(
                route.getId(),
                route.getShift().getId(),
                route.getStartAddress(),
                route.getActualDestinationAddress(),
                route.getDistanceKm(),
                route.getStartedAt(),
                route.getFinishedAt(),
                route.getNotes(),
                route.getStatus(),
                members

        );
    }
}