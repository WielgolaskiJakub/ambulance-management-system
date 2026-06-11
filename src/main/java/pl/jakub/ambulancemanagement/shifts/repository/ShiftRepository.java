package pl.jakub.ambulancemanagement.shifts.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.jakub.ambulancemanagement.shifts.model.Shift;
import pl.jakub.ambulancemanagement.shifts.model.ShiftStatus;

public interface ShiftRepository extends JpaRepository<Shift, Long> {

    boolean existsByDriver_IdAndStatus(Long driverId, ShiftStatus status);

    boolean existsByAmbulance_IdAndStatus(Long ambulanceId, ShiftStatus status);
}
