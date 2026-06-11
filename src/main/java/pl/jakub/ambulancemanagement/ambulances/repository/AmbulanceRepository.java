package pl.jakub.ambulancemanagement.ambulances.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.jakub.ambulancemanagement.ambulances.model.Ambulance;

public interface AmbulanceRepository extends JpaRepository<Ambulance, Long> {

    boolean existsByRegistrationPlates(String registrationPlates);
}
