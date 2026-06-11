package pl.jakub.ambulancemanagement.routes.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pl.jakub.ambulancemanagement.routes.dto.RouteCreateRequest;
import pl.jakub.ambulancemanagement.routes.dto.RouteFinishRequest;
import pl.jakub.ambulancemanagement.routes.dto.RouteResponse;
import pl.jakub.ambulancemanagement.routes.service.RouteService;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/routes")
public class RouteController {

    private final RouteService routeService;

    @GetMapping
    public List<RouteResponse> getAllRoutes() {
        return routeService.getAllRoutes()
                .stream()
                .map(RouteResponse::fromEntity)
                .toList();
    }

    @GetMapping("/{id}")
    public RouteResponse getRouteById(@PathVariable Long id) {
        return RouteResponse.fromEntity(routeService.getRouteById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RouteResponse createRoute(@Valid @RequestBody RouteCreateRequest request) {
        return RouteResponse.fromEntity(routeService.createRoute(request));
    }

    @PatchMapping("/{id}/start")
    public RouteResponse startRoute(@PathVariable Long id) {
        return RouteResponse.fromEntity(routeService.startRoute(id));
    }

    @PatchMapping("/{id}/finish")
    public RouteResponse finishRoute(
            @PathVariable Long id,
            @Valid @RequestBody RouteFinishRequest request
    ) {
        return RouteResponse.fromEntity(routeService.finishRoute(id, request));
    }
}
