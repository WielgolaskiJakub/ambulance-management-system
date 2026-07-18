package pl.jakub.ambulancemanagement.users.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pl.jakub.ambulancemanagement.shifts.model.ShiftStatus;
import pl.jakub.ambulancemanagement.users.model.User;
import pl.jakub.ambulancemanagement.users.model.UserRole;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;


@Repository
public interface UserRepository extends JpaRepository<User, Long> {


    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    List<User> findByActiveTrueAndCanWorkAsSanitaryTrueOrderByLastNameAscFirstNameAsc();

    @Query("""
        select distinct user from User user
        where user.active = true
        and (
            exists (
                select shift.id from Shift shift
                where shift.driver = user
                and shift.status = :activeStatus
            )
            or exists (
                select member.id from ShiftDefaultMember member
                where member.user = user
                and member.shift.status = :activeStatus
                and member.startTime <= :now
                and (member.endTime is null or member.endTime > :now)
            )
        )
        and not exists (
            select routeMember.id from RouteMember routeMember
            where routeMember.route.id = :routeId
            and routeMember.user = user
        )
        order by user.lastName asc, user.firstName asc
        """)
    List<User> findRouteMemberCandidates(
            @Param("routeId") Long routeId,
            @Param("now") LocalDateTime now,
            @Param("activeStatus") ShiftStatus activeStatus
    );

    List<User> findByUserRoleNot(UserRole useRole);
}
