package pl.jakub.ambulancemanagement.route_orders.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.jakub.ambulancemanagement.route_orders.model.RouteOrder;
import pl.jakub.ambulancemanagement.routes.model.RouteStatus;

import java.util.List;

public interface RouteOrderRepository extends JpaRepository<RouteOrder, Long> {
    List<RouteOrder> findByRoute_Id(Long routeId);
    List<RouteOrder> findByTransportOrder_Id(Long transportOrderId);
    Boolean existsByTransportOrder_IdAndRoute_StatusIn(Long transportOrderId, List<RouteStatus> statuses);

}
