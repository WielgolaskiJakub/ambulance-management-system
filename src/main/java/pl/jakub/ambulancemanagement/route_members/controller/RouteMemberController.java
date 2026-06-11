package pl.jakub.ambulancemanagement.route_members.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pl.jakub.ambulancemanagement.route_members.dto.RouteMemberCreateRequest;
import pl.jakub.ambulancemanagement.route_members.dto.RouteMemberResponse;
import pl.jakub.ambulancemanagement.route_members.dto.RouteMemberUpdateRequest;
import pl.jakub.ambulancemanagement.route_members.model.RouteMember;
import pl.jakub.ambulancemanagement.route_members.service.RouteMemberService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/route-members")
public class RouteMemberController {

    private final RouteMemberService routeMemberService;

    @GetMapping("/{id}")
    public RouteMemberResponse getRouteMemberById(@PathVariable Long id) {
        RouteMember routeMember = routeMemberService.getRouteMemberById(id);
        return RouteMemberResponse.fromEntity(routeMember);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RouteMemberResponse createRouteMember(
            @Valid @RequestBody RouteMemberCreateRequest request){
        RouteMember newRouteMember = routeMemberService.createRouteMember(request);
        return RouteMemberResponse.fromEntity(newRouteMember);
    }

    @PatchMapping("/{id}")
    public RouteMemberResponse updateRouteMember(
            @Valid @RequestBody RouteMemberUpdateRequest request, @PathVariable Long id){
        RouteMember routeMember = routeMemberService.updateRouteMember(request, id);
        return RouteMemberResponse.fromEntity(routeMember);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRouteMemberById(@PathVariable Long id){
        routeMemberService.deleteRouteMemberById(id);
    }
}
