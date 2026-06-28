package pl.jakub.ambulancemanagement.route_members.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.jakub.ambulancemanagement.route_members.model.RouteMember;

import java.util.List;
import java.util.Optional;

public interface RouteMemberRepository extends JpaRepository<RouteMember, Long> {

    List<RouteMember> findByRouteIdOrderByCreatedAtAsc(Long routeId);

    Optional<RouteMember> findByIdAndRouteId(Long id, Long routeId);

    boolean existsByRouteIdAndUserId(Long routeId, Long userId);

}
