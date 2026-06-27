package pl.jakub.ambulancemanagement.ambulances.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.jakub.ambulancemanagement.ambulances.model.Ambulance;
import pl.jakub.ambulancemanagement.ambulances.model.AmbulanceStatus;

import java.util.List;

public interface AmbulanceRepository extends JpaRepository<Ambulance, Long> {

    boolean existsByRegistrationPlates(String registrationPlates);

    List<Ambulance> findByStatusAndActive_True(AmbulanceStatus status);
}
