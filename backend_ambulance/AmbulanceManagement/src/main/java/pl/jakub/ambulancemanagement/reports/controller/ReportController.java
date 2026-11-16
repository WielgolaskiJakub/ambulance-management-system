package pl.jakub.ambulancemanagement.reports.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.repository.cdi.Eager;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pl.jakub.ambulancemanagement.reports.dto.*;
import pl.jakub.ambulancemanagement.reports.service.ReportService;

import java.time.LocalDate;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/reports")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/ambulances")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public AmbulanceReportSummaryResponse getReport(
            @Valid @ModelAttribute AmbulanceReportRequest request) {
        return reportService.getReport(request);
    }

    @GetMapping("/daily")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public DailyReportResponse getDailyReport(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date) {
        return reportService.getDailyReport(date);
    }

    @GetMapping("/drivers")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public DriverReportResponse getDriverReport(
            @Valid @ModelAttribute DriverReportRequest request) {
        return reportService.getDriverReport(request);
    }
}
