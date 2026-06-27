package pl.jakub.ambulancemanagement.refuelings.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.jakub.ambulancemanagement.refuelings.model.Refueling;

import java.util.List;

public interface RefuelingRepository extends JpaRepository<Refueling, Long> {

    List<Refueling> findByDriverIdOrderByRefuelingAtDesc(Long driverId);
}
