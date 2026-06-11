package pl.jakub.ambulancemanagement.crew_duties.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.jakub.ambulancemanagement.crew_duties.model.CrewDuty;

public interface CrewDutyRepository  extends JpaRepository<CrewDuty, Long> {
}
