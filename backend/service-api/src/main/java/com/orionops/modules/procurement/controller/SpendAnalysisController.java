package com.orionops.modules.procurement.controller;

import com.orionops.common.tenant.TenantContextHolder;
import com.orionops.modules.procurement.service.SpendAnalysisService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/procurement/spend")
@RequiredArgsConstructor
@Tag(name = "Spend Analysis", description = "Procurement spend analytics")
public class SpendAnalysisController {

    private final SpendAnalysisService spendService;

    @GetMapping("/by-vendor")
    @PreAuthorize("hasAnyRole('PROCUREMENT_VIEWER', 'FINANCE_VIEWER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getSpendByVendor(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        Map<String, Object> spend = spendService.getSpendByVendor(TenantContextHolder.getCurrentTenantId(), from, to);
        return ResponseEntity.ok(spend);
    }

    @GetMapping("/by-category")
    @PreAuthorize("hasAnyRole('PROCUREMENT_VIEWER', 'FINANCE_VIEWER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getSpendByCategory(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        Map<String, Object> spend = spendService.getSpendByCategory(TenantContextHolder.getCurrentTenantId(), from, to);
        return ResponseEntity.ok(spend);
    }

    @GetMapping("/consolidation")
    @PreAuthorize("hasAnyRole('PROCUREMENT_VIEWER', 'PROCUREMENT_MANAGER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getConsolidationOpportunities() {
        Map<String, Object> opportunities = spendService.identifyConsolidationOpportunities();
        return ResponseEntity.ok(opportunities);
    }

    @GetMapping("/concentration")
    @PreAuthorize("hasAnyRole('PROCUREMENT_VIEWER', 'PROCUREMENT_MANAGER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getVendorConcentration() {
        Map<String, Object> concentration = spendService.getVendorConcentration();
        return ResponseEntity.ok(concentration);
    }
}
