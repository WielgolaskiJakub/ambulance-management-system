package pl.jakub.ambulancemanagement.dashboards.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.jakub.ambulancemanagement.dashboards.dto.AmbulanceDashboardResponse;
import pl.jakub.ambulancemanagement.dashboards.dto.ManagerAmbulanceDashboardResponse;
import pl.jakub.ambulancemanagement.dashboards.service.DashboardService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/dashboards")
@RequiredArgsConstructor

public class DashboardController {
    private final DashboardService service;

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('DRIVER')")
    public  AmbulanceDashboardResponse getMyDashboard(){
        return service.getMyDashboard();
    }

    @GetMapping("/shift/{shiftId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public AmbulanceDashboardResponse getDashboardByShiftId(@PathVariable Long shiftId) {
        return service.getDashboardByShiftIdForAdmin(shiftId);
    }
    @GetMapping("/shifts/view")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public List<ManagerAmbulanceDashboardResponse> getDashboardByManager(){
        return service.getDashboardByManager();
    }
}
