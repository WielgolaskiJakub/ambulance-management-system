package pl.jakub.ambulancemanagement.shift_default_members.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.jakub.ambulancemanagement.shift_default_members.model.ShiftDefaultMember;

import java.util.List;

public interface ShiftDefaultMemberRepository extends JpaRepository<ShiftDefaultMember, Long> {

    boolean existsByShift_IdAndUser_Id(Long shiftId, Long userId);
    List<ShiftDefaultMember> findByShift_Id(Long shiftId);
}
