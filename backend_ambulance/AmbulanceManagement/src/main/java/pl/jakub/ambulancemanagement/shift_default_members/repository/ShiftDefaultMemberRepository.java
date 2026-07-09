package pl.jakub.ambulancemanagement.shift_default_members.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pl.jakub.ambulancemanagement.shift_default_members.model.ShiftDefaultMember;

import java.time.LocalDateTime;
import java.util.List;

public interface ShiftDefaultMemberRepository extends JpaRepository<ShiftDefaultMember, Long> {

    boolean existsByShift_IdAndUser_Id(Long shiftId, Long userId);
    List<ShiftDefaultMember> findByShift_Id(Long shiftId);


    @Query("""
    select member from ShiftDefaultMember member
    where member.shift.id = :shiftId
    and member.startTime <= :routeTime
    and (member.endTime is null or member.endTime > :routeTime)
""")

    List<ShiftDefaultMember> findActiveMembersForShiftAt(
            @Param("shiftId") Long shiftId,
            @Param("routeTime") LocalDateTime routeTime
            );
}
