package pl.jakub.ambulancemanagement.reports.dto;

import pl.jakub.ambulancemanagement.route_members.dto.RouteMemberResponse;
import pl.jakub.ambulancemanagement.routes.dto.RouteTransportOrderReferenceResponse;
import pl.jakub.ambulancemanagement.routes.model.RouteStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record RouteReportResponse(
        Long routeId,
        String registrationPlates,
        String driverFullName,
        LocalDateTime startedAt,
        LocalDateTime finishedAt,
        RouteStatus status,
        Integer distanceKm,
        BigDecimal estimatedFuelConsumedLiters,
        List<RouteTransportOrderReferenceResponse> transportOrders,
        List<RouteMemberResponse> routeMembers
){}
