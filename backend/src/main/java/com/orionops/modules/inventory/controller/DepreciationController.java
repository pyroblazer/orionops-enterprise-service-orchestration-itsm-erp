package com.orionops.modules.inventory.controller;

import com.orionops.modules.inventory.service.DepreciationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/inventory/assets")
@RequiredArgsConstructor
@Tag(name = "Asset Depreciation", description = "Fixed asset depreciation management")
public class DepreciationController {

    private final DepreciationService depreciationService;

    @GetMapping("/{id}/depreciation")
    @PreAuthorize("hasAnyRole('FINANCE_VIEWER', 'FINANCE_MANAGER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getDepreciationSchedule(@PathVariable UUID id) {
        Map<String, Object> schedule = depreciationService.createDepreciationSchedule(id);
        return ResponseEntity.ok(schedule);
    }

    @GetMapping("/{id}/book-value")
    @PreAuthorize("hasAnyRole('FINANCE_VIEWER', 'FINANCE_MANAGER', 'ADMIN')")
    public ResponseEntity<BigDecimal> getAssetBookValue(
            @PathVariable UUID id,
            @RequestParam(required = false) String asOfDate) {
        BigDecimal bookValue = depreciationService.getBookValue(id, asOfDate != null ?
            java.time.LocalDate.parse(asOfDate) : java.time.LocalDate.now());
        return ResponseEntity.ok(bookValue);
    }

    @PostMapping("/{id}/dispose")
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER', 'ADMIN')")
    public ResponseEntity<Void> disposeAsset(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body) {
        String disposalDateStr = (String) body.get("disposalDate");
        BigDecimal proceeds = new BigDecimal(body.get("proceeds").toString());
        java.time.LocalDate disposalDate = java.time.LocalDate.parse(disposalDateStr);
        depreciationService.recordAssetDisposal(id, disposalDate, proceeds);
        return ResponseEntity.ok().build();
    }
}
