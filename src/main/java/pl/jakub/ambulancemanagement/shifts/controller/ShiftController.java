package pl.jakub.ambulancemanagement.shifts.controller;



import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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

    @GetMapping
    public List<ShiftResponse> getAllShifts(){
        return shiftService.getAllShifts().stream().map(ShiftResponse::fromEntity).toList();
    }

    @GetMapping("/{id}")
    public ShiftResponse getShiftById(@PathVariable Long id){
        Shift shift = shiftService.getShiftById(id);
        return ShiftResponse.fromEntity(shift);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ShiftResponse createShift(@Valid @RequestBody ShiftCreateRequest request){
        Shift createdShift = shiftService.createShift(request);
        return ShiftResponse.fromEntity(createdShift);
    }

    @PatchMapping("/{id}/edit")
    public ShiftResponse updateShiftByUser (@PathVariable Long id,
                                            @Valid @RequestBody ShiftUpdateByUserRequest request){
        Shift updatedShift = shiftService.updateShiftByUser(id, request);
        return ShiftResponse.fromEntity(updatedShift);
    }

    @PatchMapping("/{id}/finish")
    public ShiftResponse finishShift(@PathVariable Long id){
        Shift updatedShift = shiftService.finishShift(id);
        return ShiftResponse.fromEntity(updatedShift);
    }

    @PatchMapping("/{id}/cancel")
    public ShiftResponse cancelShift(@PathVariable Long id){
        Shift updatedShift = shiftService.cancelShiftById(id);
        return ShiftResponse.fromEntity(updatedShift);
    }
}
