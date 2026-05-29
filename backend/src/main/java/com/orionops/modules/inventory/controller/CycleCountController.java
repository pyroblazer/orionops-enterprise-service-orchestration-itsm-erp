package com.orionops.modules.inventory.controller;

import com.orionops.modules.inventory.service.CycleCountService;
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
@RequestMapping("/api/v1/inventory/cycle-counts")
@RequiredArgsConstructor
@Tag(name = "Cycle Counting", description = "Inventory cycle count operations")
public class CycleCountController {

    private final CycleCountService cycleCountService;

    @PostMapping("/schedule")
    @PreAuthorize("hasAnyRole('WAREHOUSE_MANAGER', 'INVENTORY_MANAGER', 'ADMIN')")
    public ResponseEntity<Void> scheduleCycleCounts(@RequestBody Map<String, Object> body) {
        UUID warehouseId = UUID.fromString((String) body.get("warehouseId"));
        cycleCountService.scheduleCycleCounts(warehouseId, body);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/record")
    @PreAuthorize("hasAnyRole('WAREHOUSE_MANAGER', 'INVENTORY_MANAGER', 'ADMIN')")
    public ResponseEntity<Void> recordCycleCount(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body) {
        BigDecimal countedQuantity = new BigDecimal(body.get("countedQuantity").toString());
        String notes = (String) body.get("notes");
        cycleCountService.recordCycleCount(id, countedQuantity, notes);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/variances")
    @PreAuthorize("hasAnyRole('WAREHOUSE_MANAGER', 'INVENTORY_MANAGER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> detectVariances(@PathVariable UUID id) {
        Map<String, Object> variances = cycleCountService.detectVariances(id);
        return ResponseEntity.ok(variances);
    }

    @PostMapping("/{id}/investigate")
    @PreAuthorize("hasAnyRole('WAREHOUSE_MANAGER', 'INVENTORY_MANAGER', 'ADMIN')")
    public ResponseEntity<Void> investigateVariance(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body) {
        String reason = (String) body.get("reason");
        UUID updatedQty = UUID.fromString((String) body.get("updatedQty"));
        cycleCountService.investigateVariance(id, reason, updatedQty);
        return ResponseEntity.ok().build();
    }
}
