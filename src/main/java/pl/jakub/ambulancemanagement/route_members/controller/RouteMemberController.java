package pl.jakub.ambulancemanagement.route_members.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pl.jakub.ambulancemanagement.route_members.dto.RouteMemberCreateRequest;
import pl.jakub.ambulancemanagement.route_members.dto.RouteMemberResponse;
import pl.jakub.ambulancemanagement.route_members.dto.RouteMemberUpdateRequest;
import pl.jakub.ambulancemanagement.route_members.model.RouteMember;
import pl.jakub.ambulancemanagement.route_members.service.RouteMemberService;

import java.util.List;
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/routes/{routeId}/members")
public class RouteMemberController {

    private final RouteMemberService routeMemberService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DRIVER', 'SANITARY')")
    public List<RouteMemberResponse> getRouteMembersByRoute(@PathVariable Long routeId) {
        return routeMemberService.getRouteMembersByRoute(routeId)
                .stream()
                .map(RouteMemberResponse::fromEntity)
                .toList();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DRIVER', 'SANITARY')")
    @ResponseStatus(HttpStatus.CREATED)
    public RouteMemberResponse addRouteMemberToRoute(
            @PathVariable Long routeId,
            @Valid @RequestBody RouteMemberCreateRequest request
    ) {
        RouteMember routeMember = routeMemberService.addRouteMemberToRoute(routeId, request);
        return RouteMemberResponse.fromEntity(routeMember);
    }

    @PatchMapping("/{memberId}")
    @PreAuthorize("hasAnyRole('DRIVER', 'SANITARY')")
    public RouteMemberResponse updateRouteMember(
            @PathVariable Long routeId,
            @PathVariable Long memberId,
            @Valid @RequestBody RouteMemberUpdateRequest request
    ) {
        RouteMember routeMember = routeMemberService.updateRouteMember(routeId, memberId, request);
        return RouteMemberResponse.fromEntity(routeMember);
    }

    @DeleteMapping("/{memberId}")
    @PreAuthorize("hasAnyRole('DRIVER', 'SANITARY', 'ADMIN', 'MANAGER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRouteMember(
            @PathVariable Long routeId,
            @PathVariable Long memberId
    ) {
        routeMemberService.deleteRouteMember(routeId, memberId);
    }
}