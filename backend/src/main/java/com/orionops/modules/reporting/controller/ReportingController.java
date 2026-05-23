package com.orionops.modules.reporting.controller;

import com.orionops.common.dto.ApiResponse;
import com.orionops.modules.reporting.dto.ReportSummaryResponse;
import com.orionops.modules.reporting.service.ReportingService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Tag(name = "Reporting", description = "Operational reports: MTTR, MTTA, SLA breach rate, volume trends")
public class ReportingController {

    private final ReportingService reportingService;

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SERVICE_OWNER', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<ReportSummaryResponse>> getSummary(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(ApiResponse.success(reportingService.getSummary(days)));
    }
}
