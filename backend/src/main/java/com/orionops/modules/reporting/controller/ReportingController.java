package com.orionops.modules.reporting.controller;

import com.orionops.common.dto.ApiResponse;
import com.orionops.common.tenant.TenantContextHolder;
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

import java.util.List;
import java.util.Map;

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

    // ---- ERP Financial Reports ----

    @GetMapping("/finance/budget-variance")
    @PreAuthorize("hasAnyRole('FINANCE', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getBudgetVariance() {
        return ResponseEntity.ok(ApiResponse.success(
            reportingService.getBudgetVariance(TenantContextHolder.getCurrentTenantId())));
    }

    @GetMapping("/finance/expense-breakdown")
    @PreAuthorize("hasAnyRole('FINANCE', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getExpenseBreakdown(
            @RequestParam String period) {
        return ResponseEntity.ok(ApiResponse.success(
            reportingService.getExpenseBreakdown(TenantContextHolder.getCurrentTenantId(), period)));
    }

    @GetMapping("/finance/invoice-aging")
    @PreAuthorize("hasAnyRole('FINANCE', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getInvoiceAging() {
        return ResponseEntity.ok(ApiResponse.success(
            reportingService.getInvoiceAging(TenantContextHolder.getCurrentTenantId())));
    }

    @GetMapping("/procurement/po-aging")
    @PreAuthorize("hasAnyRole('PROCUREMENT', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPOAging() {
        return ResponseEntity.ok(ApiResponse.success(
            reportingService.getPOAging(TenantContextHolder.getCurrentTenantId())));
    }

    @GetMapping("/procurement/vendor-spend")
    @PreAuthorize("hasAnyRole('PROCUREMENT', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getVendorSpend() {
        return ResponseEntity.ok(ApiResponse.success(
            reportingService.getVendorSpend(TenantContextHolder.getCurrentTenantId())));
    }

    @GetMapping("/inventory/valuation")
    @PreAuthorize("hasAnyRole('PROCUREMENT', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getInventoryValuation() {
        return ResponseEntity.ok(ApiResponse.success(
            reportingService.getInventoryValuation(TenantContextHolder.getCurrentTenantId())));
    }

    @GetMapping("/inventory/stock-movements")
    @PreAuthorize("hasAnyRole('PROCUREMENT', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getStockMovements(
            @RequestParam String period) {
        return ResponseEntity.ok(ApiResponse.success(
            reportingService.getStockMovements(TenantContextHolder.getCurrentTenantId(), period)));
    }

    @GetMapping("/workforce/capacity-utilization")
    @PreAuthorize("hasAnyRole('MANAGER', 'EXECUTIVE', 'HR')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getWorkforceCapacityUtilization() {
        return ResponseEntity.ok(ApiResponse.success(
            reportingService.getWorkforceCapacityUtilization(TenantContextHolder.getCurrentTenantId())));
    }

    @GetMapping("/vendor/performance-summary")
    @PreAuthorize("hasAnyRole('PROCUREMENT', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getVendorPerformanceSummary() {
        return ResponseEntity.ok(ApiResponse.success(
            reportingService.getVendorPerformanceSummary(TenantContextHolder.getCurrentTenantId())));
    }

    @GetMapping("/billing/chargeback")
    @PreAuthorize("hasAnyRole('FINANCE', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getBillingChargeback() {
        return ResponseEntity.ok(ApiResponse.success(
            reportingService.getBillingChargeback(TenantContextHolder.getCurrentTenantId())));
    }
}
