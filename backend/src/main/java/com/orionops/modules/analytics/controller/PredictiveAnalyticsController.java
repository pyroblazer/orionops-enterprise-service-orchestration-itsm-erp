package com.orionops.modules.analytics.controller;

import com.orionops.common.tenant.TenantContextHolder;
import com.orionops.modules.analytics.service.PredictiveAnalyticsService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@Tag(name = "Predictive Analytics", description = "Predictive analytics and forecasting")
public class PredictiveAnalyticsController {

    private final PredictiveAnalyticsService analyticsService;

    @GetMapping("/cash-flow")
    @PreAuthorize("hasAnyRole('FINANCE_VIEWER', 'FINANCE_MANAGER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> predictCashFlow(
            @RequestParam(required = false, defaultValue = "12") int months) {
        Map<String, Object> forecast = analyticsService.predictCashFlow(TenantContextHolder.getCurrentTenantId(), months);
        return ResponseEntity.ok(forecast);
    }

    @GetMapping("/anomalies")
    @PreAuthorize("hasAnyRole('FINANCE_VIEWER', 'FINANCE_MANAGER', 'ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> detectAnomalies() {
        List<Map<String, Object>> anomalies = analyticsService.detectAnomalousTransactions();
        return ResponseEntity.ok(anomalies);
    }

    @GetMapping("/vendor-risk/{vendorId}")
    @PreAuthorize("hasAnyRole('PROCUREMENT_VIEWER', 'PROCUREMENT_MANAGER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> predictVendorRisk(@PathVariable UUID vendorId) {
        Map<String, Object> risk = analyticsService.predictVendorBankruptcy(vendorId);
        return ResponseEntity.ok(risk);
    }
}
