package pl.jakub.ambulancemanagement.routes.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pl.jakub.ambulancemanagement.routes.dto.RouteCreateRequest;
import pl.jakub.ambulancemanagement.routes.dto.RouteDetailsResponse;
import pl.jakub.ambulancemanagement.routes.dto.RouteFinishRequest;
import pl.jakub.ambulancemanagement.routes.dto.RouteResponse;
import pl.jakub.ambulancemanagement.routes.service.RouteService;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/routes")
public class RouteController {

    private final RouteService routeService;


    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('DRIVER', 'SANITARY')")
    public List<RouteResponse> getMyRoutes(){
        return routeService.getMyRoutes();
    }

    @GetMapping("/me/{id}")
    @PreAuthorize("hasAnyRole('DRIVER', 'SANITARY')")
    public RouteResponse getMyRouteById(@PathVariable Long id){
        return routeService.getMyRouteById(id);
    }


    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public List<RouteResponse> getAllRoutes() {
        return routeService.getAllRoutes()
                .stream()
                .map(RouteResponse::fromEntity)
                .toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public RouteResponse getRouteById(@PathVariable Long id) {
        return RouteResponse.fromEntity(routeService.getRouteById(id));
    }

    @GetMapping("/{id}/details")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DRIVER','SANITARY')")
    public RouteDetailsResponse getRouteDetailsById(@PathVariable Long id) {
        return routeService.getRouteDetailsById(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DRIVER')")
    @ResponseStatus(HttpStatus.CREATED)
    public RouteResponse createRoute(@Valid @RequestBody RouteCreateRequest request) {
        return RouteResponse.fromEntity(routeService.createRoute(request));
    }

    @PatchMapping("/{id}/start")
    @PreAuthorize("hasAnyRole('DRIVER','SANITARY')")
    public RouteResponse startRoute(@PathVariable Long id) {
        return RouteResponse.fromEntity(routeService.startRoute(id));
    }

    @PatchMapping("/{id}/waiting")
    @PreAuthorize("hasAnyRole('DRIVER','SANITARY')")
    public RouteResponse markRouteAsWaiting(@PathVariable Long id) {
        return RouteResponse.fromEntity(routeService.markRouteAsWaiting(id));
    }

    @PatchMapping("/{id}/resume")
    @PreAuthorize("hasAnyRole('DRIVER','SANITARY')")
    public RouteResponse resumeRoute(@PathVariable Long id) {
        return RouteResponse.fromEntity(routeService.resumeRoute(id));
    }

    @PatchMapping("/{id}/finish")
    @PreAuthorize("hasAnyRole('DRIVER','SANITARY')")
    public RouteResponse finishRoute(
            @PathVariable Long id,
            @Valid @RequestBody RouteFinishRequest request
    ) {
        return RouteResponse.fromEntity(routeService.finishRoute(id, request));
    }
}
