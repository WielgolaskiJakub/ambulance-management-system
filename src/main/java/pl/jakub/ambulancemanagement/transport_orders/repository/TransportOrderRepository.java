package pl.jakub.ambulancemanagement.transport_orders.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportOrder;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportStatus;

import java.util.List;

@Repository
public interface TransportOrderRepository extends JpaRepository<TransportOrder, java.lang.Long> {

    boolean existsByOrderNumber(String orderNumber);
    List<TransportOrder> findByStatus(TransportStatus status);
}
