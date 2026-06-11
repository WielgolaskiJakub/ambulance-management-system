package pl.jakub.ambulancemanagement.route_members.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.jakub.ambulancemanagement.route_members.model.RouteMember;

public interface RouteMemberRepository extends JpaRepository<RouteMember, Long> {
}
