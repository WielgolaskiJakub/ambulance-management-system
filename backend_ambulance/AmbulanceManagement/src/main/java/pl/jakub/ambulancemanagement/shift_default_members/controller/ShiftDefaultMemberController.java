package pl.jakub.ambulancemanagement.shift_default_members.controller;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pl.jakub.ambulancemanagement.shift_default_members.dto.CreateShiftDefaultMemberRequest;
import pl.jakub.ambulancemanagement.shift_default_members.dto.ShiftDefaultMemberResponse;
import pl.jakub.ambulancemanagement.shift_default_members.dto.UpdateShiftDefaultMemberByUserRequest;
import pl.jakub.ambulancemanagement.shift_default_members.model.ShiftDefaultMember;
import pl.jakub.ambulancemanagement.shift_default_members.service.ShiftDefaultMemberService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/shift-default-members")
@RequiredArgsConstructor
public class ShiftDefaultMemberController {

    private final ShiftDefaultMemberService shiftDefaultMemberService;

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public List<ShiftDefaultMemberResponse> getAllShiftDefaultMembers() {
        return shiftDefaultMemberService.getAllShiftDefaultMembers()
                .stream().map(ShiftDefaultMemberResponse::fromEntity).toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ShiftDefaultMemberResponse getShiftDefaultMemberById(@PathVariable long id) {
        ShiftDefaultMember shiftDefaultMember = shiftDefaultMemberService.getShiftDefaultMemberById(id);
        return ShiftDefaultMemberResponse.fromEntity(shiftDefaultMember);
    }
    @GetMapping("/shift/{shiftId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'DRIVER')")
    public List<ShiftDefaultMemberResponse> getShiftDefaultMembersByShiftId(@PathVariable long shiftId) {
        return shiftDefaultMemberService.getShiftDefaultMembersByShiftId(shiftId)
                .stream()
                .map(ShiftDefaultMemberResponse::fromEntity)
                .toList();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'DRIVER')")
    @ResponseStatus(HttpStatus.CREATED)
    public ShiftDefaultMemberResponse createShiftDefaultMember(
            @Valid @RequestBody CreateShiftDefaultMemberRequest request) {
        ShiftDefaultMember shiftDefaultMember = shiftDefaultMemberService.createShiftDefaultMember(request);
        return ShiftDefaultMemberResponse.fromEntity(shiftDefaultMember);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'DRIVER')")
    public ShiftDefaultMemberResponse updateShiftDefaultMember(
            @PathVariable long id,
            @Valid @RequestBody UpdateShiftDefaultMemberByUserRequest request
    ) {
        ShiftDefaultMember shiftDefaultMember = shiftDefaultMemberService.updateShiftDefaultMemberByUser(id, request);
        return ShiftDefaultMemberResponse.fromEntity(shiftDefaultMember);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'DRIVER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteShiftDefaultMemberById(@PathVariable long id) {
        shiftDefaultMemberService.deleteShiftDefaultMemberById(id);
    }
}
