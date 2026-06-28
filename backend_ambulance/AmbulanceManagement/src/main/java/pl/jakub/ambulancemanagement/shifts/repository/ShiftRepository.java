package pl.jakub.ambulancemanagement.shifts.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.jakub.ambulancemanagement.shifts.model.Shift;
import pl.jakub.ambulancemanagement.shifts.model.ShiftStatus;

import java.util.List;
import java.util.Optional;

public interface ShiftRepository extends JpaRepository<Shift, Long> {

    boolean existsByDriver_IdAndStatus(Long driverId, ShiftStatus status);

    boolean existsByAmbulance_IdAndStatus(Long ambulanceId, ShiftStatus status);

    Optional<Shift> findByDriver_IdAndStatus(Long driverId, ShiftStatus status);

    List<Shift> findByDriver_IdOrderByStartTimeDesc(Long driverId);

    Optional<Shift> findByIdAndDriver_Id(Long id, Long driverId);

}
