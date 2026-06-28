package pl.jakub.ambulancemanagement.transport_order_patient_data.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.jakub.ambulancemanagement.transport_order_patient_data.model.TransportOrderPatientData;

import java.util.List;

public interface TransportOrderPatientDataRepository extends JpaRepository<TransportOrderPatientData, Long> {
    List<TransportOrderPatientData> findByTransportOrderId(Long transportOrderId);
}
