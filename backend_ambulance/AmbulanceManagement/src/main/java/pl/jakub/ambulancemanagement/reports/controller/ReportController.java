package pl.jakub.ambulancemanagement.reports.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.jakub.ambulancemanagement.reports.dto.AmbulanceReportSummaryResponse;
import pl.jakub.ambulancemanagement.reports.dto.AmbulanceReportRequest;
import pl.jakub.ambulancemanagement.reports.service.ReportService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/reports")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/ambulances")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public AmbulanceReportSummaryResponse getReport(
            @Valid @ModelAttribute AmbulanceReportRequest request){
        return reportService.getReport(request);
    }
}
