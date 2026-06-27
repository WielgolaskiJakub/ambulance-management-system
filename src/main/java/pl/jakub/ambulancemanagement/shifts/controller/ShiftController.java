package pl.jakub.ambulancemanagement.shifts.controller;



import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pl.jakub.ambulancemanagement.shifts.dto.ShiftCreateRequest;
import pl.jakub.ambulancemanagement.shifts.dto.ShiftResponse;
import pl.jakub.ambulancemanagement.shifts.dto.ShiftUpdateByUserRequest;
import pl.jakub.ambulancemanagement.shifts.model.Shift;
import pl.jakub.ambulancemanagement.shifts.service.ShiftService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/shifts")
@RequiredArgsConstructor
public class ShiftController {

    private final ShiftService shiftService;

    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @GetMapping
    public List<ShiftResponse> getAllShifts(){
        return shiftService.getAllShifts().stream().map(ShiftResponse::fromEntity).toList();
    }

    @PreAuthorize("hasAnyRole('DRIVER')")
    @GetMapping("/me")
    public List<ShiftResponse> getMyShifts(){
        return shiftService.getMyShifts().stream().map(ShiftResponse::fromEntity).toList();
    }

    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @GetMapping("/{id}")
    public ShiftResponse getShiftById(@PathVariable Long id){
        Shift shift = shiftService.getShiftById(id);
        return ShiftResponse.fromEntity(shift);
    }
    @PreAuthorize("hasAnyRole('DRIVER')")
    @GetMapping("/me/{id}")
    public ShiftResponse getMyShiftById(@PathVariable Long id){
        Shift shift = shiftService.getMyShiftById(id);
        return ShiftResponse.fromEntity(shift);
    }
    @PreAuthorize("hasAnyRole('DRIVER')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ShiftResponse createShift(@Valid @RequestBody ShiftCreateRequest request){
        Shift createdShift = shiftService.createShift(request);
        return ShiftResponse.fromEntity(createdShift);
    }
    @PreAuthorize("hasAnyRole('DRIVER')")
    @PatchMapping("/{id}/edit")
    public ShiftResponse updateShiftByUser (@PathVariable Long id,
                                            @Valid @RequestBody ShiftUpdateByUserRequest request){
        Shift updatedShift = shiftService.updateShiftByUser(id, request);
        return ShiftResponse.fromEntity(updatedShift);
    }
    @PreAuthorize("hasAnyRole('DRIVER')")
    @PatchMapping("/{id}/finish")
    public ShiftResponse finishShift(@PathVariable Long id){
        Shift updatedShift = shiftService.finishShift(id);
        return ShiftResponse.fromEntity(updatedShift);
    }
    @PreAuthorize("hasAnyRole('DRIVER')")
    @PatchMapping("/{id}/cancel")
    public ShiftResponse cancelShift(@PathVariable Long id){
        Shift updatedShift = shiftService.cancelShiftById(id);
        return ShiftResponse.fromEntity(updatedShift);
    }
}
