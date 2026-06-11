package pl.jakub.ambulancemanagement.transport_orders.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportOrder;

@Repository
public interface TransportOrderRepository extends JpaRepository<TransportOrder, java.lang.Long> {

    boolean existsByOrderNumber(String orderNumber);
}
