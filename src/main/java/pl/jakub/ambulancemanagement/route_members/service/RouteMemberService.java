package pl.jakub.ambulancemanagement.route_members.service;


import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pl.jakub.ambulancemanagement.auth.security.CurrentUserService;
import pl.jakub.ambulancemanagement.exception.ApiException;
import pl.jakub.ambulancemanagement.exception.ErrorCode;
import pl.jakub.ambulancemanagement.route_members.dto.RouteMemberCreateRequest;
import pl.jakub.ambulancemanagement.route_members.dto.RouteMemberUpdateRequest;
import pl.jakub.ambulancemanagement.route_members.model.RouteMember;
import pl.jakub.ambulancemanagement.route_members.model.RouteMemberSource;
import pl.jakub.ambulancemanagement.route_members.repository.RouteMemberRepository;
import pl.jakub.ambulancemanagement.routes.model.Route;
import pl.jakub.ambulancemanagement.routes.service.RouteService;
import pl.jakub.ambulancemanagement.users.model.User;
import pl.jakub.ambulancemanagement.users.model.UserRole;
import pl.jakub.ambulancemanagement.users.service.UserService;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RouteMemberService {

    private final RouteMemberRepository routeMemberRepository;
    private final RouteService routeService;
    private final UserService userService;
    private final CurrentUserService currentUserService;


    public List<RouteMember> getRouteMembersByRoute(Long routeId) {
        Route route = routeService.getRouteById(routeId);

        validateCurrentUserCanAccessRoute(route);

        return routeMemberRepository.findByRouteIdOrderByCreatedAtAsc(routeId);
    }

    public RouteMember addRouteMemberToRoute(Long routeId, RouteMemberCreateRequest request) {

        Route route = routeService.getRouteById(routeId);

        validateCurrentUserCanAccessRoute(route);

        validateRouteMemberCreateRequest(request);

        RouteMember routeMember = new RouteMember();
        routeMember.setRoute(route);
        routeMember.setRole(request.getMemberRole());
        routeMember.setCreatedAt(LocalDateTime.now());

        if(request.getUserId() != null){
            User memberUser = userService.getUserById(request.getUserId());

            if(!Boolean.TRUE.equals(memberUser.getActive())){
                throw new ApiException(ErrorCode.USER_NOT_ACTIVE);
            }
            routeMember.setUser(memberUser);
            routeMember.setMemberName(null);
            routeMember.setSource(RouteMemberSource.SHIFT_TEAM);
        }else{
            routeMember.setUser(null);
            routeMember.setMemberName(request.getMemberName().trim());
            routeMember.setSource(request.getMemberSource());
        }

        return routeMemberRepository.save(routeMember);
    }

    public RouteMember updateRouteMember(Long routeId, Long memberId, RouteMemberUpdateRequest request) {
        Route route = routeService.getRouteById(routeId);

        validateCurrentUserCanAccessRoute(route);

        RouteMember routeMemberToUpdate = routeMemberRepository.findByIdAndRouteId(memberId, routeId)
                .orElseThrow(() -> new ApiException(ErrorCode.ROUTE_MEMBER_NOT_FOUND));

        boolean wantsToChangeUser = request.getUserId() != null;
        boolean wantsToChangeMemberName = request.getMemberName() != null;

        if (wantsToChangeUser && wantsToChangeMemberName) {
            throw new ApiException(ErrorCode.ROUTE_MEMBER_INVALID_REQUEST);
        }

        if (wantsToChangeUser) {
            User user = userService.getUserById(request.getUserId());

            if (!Boolean.TRUE.equals(user.getActive())) {
                throw new ApiException(ErrorCode.USER_NOT_ACTIVE);
            }

            routeMemberToUpdate.setUser(user);
            routeMemberToUpdate.setMemberName(null);
            routeMemberToUpdate.setSource(RouteMemberSource.SHIFT_TEAM);
        }

        if (wantsToChangeMemberName) {
            if (request.getMemberName().isBlank()) {
                throw new ApiException(ErrorCode.ROUTE_MEMBER_INVALID_REQUEST);
            }

            routeMemberToUpdate.setUser(null);
            routeMemberToUpdate.setMemberName(request.getMemberName().trim());
        }

        if (request.getMemberRole() != null) {
            routeMemberToUpdate.setRole(request.getMemberRole());
        }

        if (request.getMemberSource() != null) {
            routeMemberToUpdate.setSource(request.getMemberSource());
        }

        validateRouteMemberEntity(routeMemberToUpdate);

        return routeMemberRepository.save(routeMemberToUpdate);
    }

    public void deleteRouteMember(Long routeId, Long memberId) {

        Route route = routeService.getRouteById(routeId);

      validateCurrentUserCanAccessRoute(route);

        RouteMember routeMemberToDelete = routeMemberRepository.findByIdAndRouteId(memberId, routeId)
                .orElseThrow(() -> new ApiException(ErrorCode.ROUTE_MEMBER_NOT_FOUND));

        routeMemberRepository.delete(routeMemberToDelete);
    }

    private void validateRouteMemberEntity(RouteMember routeMember) {
        boolean hasUser = routeMember.getUser() != null;
        boolean hasMemberName = routeMember.getMemberName() != null && !routeMember.getMemberName().isBlank();

        if (hasUser == hasMemberName) {
            throw new ApiException(ErrorCode.ROUTE_MEMBER_INVALID_REQUEST);
        }

        if (routeMember.getRole() == null) {
            throw new ApiException(ErrorCode.ROUTE_MEMBER_INVALID_REQUEST);
        }

        if (routeMember.getSource() == null) {
            throw new ApiException(ErrorCode.ROUTE_MEMBER_INVALID_REQUEST);
        }
    }
    private void validateRouteMemberCreateRequest(RouteMemberCreateRequest request) {
        boolean hasUserId = request.getUserId() != null;
        boolean hasMemberName = request.getMemberName() != null && !request.getMemberName().isBlank();

        if (hasUserId == hasMemberName) {
            throw new ApiException(ErrorCode.ROUTE_MEMBER_INVALID_REQUEST);
        }
    }
    private void validateCurrentUserCanAccessRoute(Route route) {
        User currentUser = currentUserService.getCurrentUser();

        if (currentUser.getUserRole() == UserRole.ADMIN ||
                currentUser.getUserRole() == UserRole.MANAGER) {
            return;
        }

        if (route.getShift().getDriver().getId().equals(currentUser.getId())) {
            return;
        }

        throw new ApiException(ErrorCode.ROUTE_ACCESS_DENIED);
    }
}
