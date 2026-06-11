package pl.jakub.ambulancemanagement.route_members.service;


import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pl.jakub.ambulancemanagement.exception.ApiException;
import pl.jakub.ambulancemanagement.exception.ErrorCode;
import pl.jakub.ambulancemanagement.route_members.dto.RouteMemberCreateRequest;
import pl.jakub.ambulancemanagement.route_members.dto.RouteMemberUpdateRequest;
import pl.jakub.ambulancemanagement.route_members.model.RouteMember;
import pl.jakub.ambulancemanagement.route_members.repository.RouteMemberRepository;
import pl.jakub.ambulancemanagement.routes.model.Route;
import pl.jakub.ambulancemanagement.routes.repository.RouteRepository;
import pl.jakub.ambulancemanagement.users.model.User;
import pl.jakub.ambulancemanagement.users.repository.UserRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RouteMemberService {

    private final RouteMemberRepository routeMemberRepository;
    private final RouteRepository routeRepository;
    private final UserRepository userRepository;

    public List<RouteMember> getAllRouteMembers() {
        return routeMemberRepository.findAll();
    }

    public RouteMember getRouteMemberById(long id) {
        return routeMemberRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.ROUTE_MEMBER_NOT_FOUND));
    }

    public RouteMember createRouteMember(RouteMemberCreateRequest request) {

        RouteMember routeMember = new RouteMember();

        Route route = routeRepository.findById(request.getRouteId())
                .orElseThrow(() -> new ApiException(ErrorCode.ROUTE_NOT_FOUND));

        routeMember.setRoute(route);
        routeMember.setRole(request.getMemberRole());
        routeMember.setSource(request.getMemberSource());

        boolean hasUserId = request.getUserId() != null;
        boolean hasMemberName = hasText(request.getMemberName());

        if (!hasUserId && !hasMemberName) {
            throw new ApiException(ErrorCode.ROUTE_MEMBER_INVALID_REQUEST);
        }
        if (hasUserId && hasMemberName) {
            throw new ApiException(ErrorCode.ROUTE_MEMBER_INVALID_REQUEST);
        }

        if (hasUserId) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
            if (!Boolean.TRUE.equals(user.getActive())) {
                throw new ApiException(ErrorCode.USER_NOT_ACTIVE);
            }
            routeMember.setUser(user);
            routeMember.setMemberName(null);
        }

        if (hasMemberName) {
            routeMember.setUser(null);
            routeMember.setMemberName(normalizeNullableText(request.getMemberName()));
        }
        return routeMemberRepository.save(routeMember);
    }

    public RouteMember updateRouteMember(RouteMemberUpdateRequest request, long id) {

        RouteMember routeMemberToUpdate = getRouteMemberById(id);

        boolean wantsToChangeUser = request.getUserId() != null;
        boolean wantsToChangeMemberName = request.getMemberName() != null;

        if (wantsToChangeUser && wantsToChangeMemberName) {
            throw new ApiException(ErrorCode.ROUTE_MEMBER_INVALID_REQUEST);
        }

        if (wantsToChangeUser) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

            if (!Boolean.TRUE.equals(user.getActive())) {
                throw new ApiException(ErrorCode.USER_NOT_ACTIVE);
            }

            routeMemberToUpdate.setUser(user);
            routeMemberToUpdate.setMemberName(null);
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

        validateRouteMemberHasUserOrName(routeMemberToUpdate);

        return routeMemberRepository.save(routeMemberToUpdate);
    }

    public void deleteRouteMemberById(long id) {
        RouteMember routeMemberToDelete = getRouteMemberById(id);
        routeMemberRepository.delete(routeMemberToDelete);
    }

    private String normalizeNullableText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private void validateRouteMemberHasUserOrName(RouteMember routeMember) {
        boolean hasUser = routeMember.getUser() != null;
        boolean hasMemberName = routeMember.getMemberName() != null && !routeMember.getMemberName().isBlank();

        if (!hasUser && !hasMemberName) {
            throw new ApiException(ErrorCode.ROUTE_MEMBER_INVALID_REQUEST);
        }

        if (hasUser && hasMemberName) {
            throw new ApiException(ErrorCode.ROUTE_MEMBER_INVALID_REQUEST);
        }
    }
}
