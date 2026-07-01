package pl.jakub.ambulancemanagement.routes.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pl.jakub.ambulancemanagement.routes.model.Route;
import pl.jakub.ambulancemanagement.routes.model.RouteStatus;

import java.util.List;
import java.util.Optional;

public interface RouteRepository extends JpaRepository<Route, Long> {

    @Query("""
            select distinct r from Route r
            where r.shift.driver.id = :userId
            or exists (
            select 1 from RouteMember rm
            where rm.route = r
            and rm.user.id = :userId
            )
            order by r.id desc
            """)
    List<Route> findMyRoutes(@Param("userId") Long userId);


    @Query("""
                         select r from Route r
                         where r.id = :routeId
                         and(
                         r.shift.driver.id = :userId
                         or exists (
                         select 1 from RouteMember rm
                         where rm.route = r
                         and rm.user.id = :userId
                         )
                         )
            """)
    Optional<Route> findMyRouteById(@Param("routeId") Long routeId,
                                    @Param("userId") Long userId);


    boolean existsByShift_IdAndStatusIn(Long shiftId, List<RouteStatus> statuses);
}
