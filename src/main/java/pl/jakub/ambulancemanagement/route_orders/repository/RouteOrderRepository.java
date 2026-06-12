package pl.jakub.ambulancemanagement.route_orders.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.jakub.ambulancemanagement.route_orders.model.RouteOrder;
import pl.jakub.ambulancemanagement.routes.model.RouteStatus;

import java.util.List;

public interface RouteOrderRepository extends JpaRepository<RouteOrder, Long> {
    List<RouteOrder> findByRouteId(Long routeId);
    List<RouteOrder> findByTransportOrderId(Long transportOrderId);
    Boolean existsByTransportOrderIdAndRouteStatusIn(Long transportOrderId, List<RouteStatus> statuses);
}
