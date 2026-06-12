package pl.jakub.ambulancemanagement.route_orders.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.jakub.ambulancemanagement.route_orders.model.RouteOrder;

import java.util.List;

public interface RouteOrderRepository extends JpaRepository<RouteOrder, Long> {
    List<RouteOrder> findByRouteId(Long routeId);
}
