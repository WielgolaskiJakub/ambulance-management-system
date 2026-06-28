package pl.jakub.ambulancemanagement.route_orders.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pl.jakub.ambulancemanagement.route_orders.model.RouteOrder;
import pl.jakub.ambulancemanagement.routes.model.RouteStatus;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportOrder;

import java.util.List;

public interface RouteOrderRepository extends JpaRepository<RouteOrder, Long> {
    List<RouteOrder> findByRoute_Id(Long routeId);

    List<RouteOrder> findByTransportOrder_Id(Long transportOrderId);

    Boolean existsByTransportOrder_IdAndRoute_StatusIn(Long transportOrderId, List<RouteStatus> statuses);

    List<RouteOrder> findByRoute_Shift_Driver_Id(Long driverId);

    @Query("""
                select distinct ro.transportOrder
                from RouteOrder ro
                join RouteMember rm on rm.route.id = ro.route.id
                where rm.user.id = :userId
            """)
    List<TransportOrder> findTransportOrdersByRouteMemberUserId(@Param("userId") Long userId);

    @Query("""
            select distinct ro.transportOrder
            from RouteOrder ro
            where ro.route.shift.driver.id = :driverId
            """)
    List<TransportOrder> findTransportOrdersByRouteDriverId(@Param("driverId") Long driverId);
}
