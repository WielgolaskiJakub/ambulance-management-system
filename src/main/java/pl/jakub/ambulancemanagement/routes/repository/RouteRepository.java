package pl.jakub.ambulancemanagement.routes.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.jakub.ambulancemanagement.routes.model.Route;

public interface RouteRepository extends JpaRepository<Route, Long> {

}
