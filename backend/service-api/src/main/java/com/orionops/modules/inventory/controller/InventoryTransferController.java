package com.orionops.modules.inventory.controller;

import com.orionops.modules.inventory.service.InventoryTransferService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/inventory/transfers")
@RequiredArgsConstructor
@Tag(name = "Inventory Transfers", description = "Multi-location inventory transfers")
public class InventoryTransferController {

    private final InventoryTransferService transferService;

    @PostMapping
    @PreAuthorize("hasAnyRole('WAREHOUSE_MANAGER', 'INVENTORY_MANAGER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> createTransfer(@RequestBody Map<String, Object> body) {
        UUID fromWarehouse = UUID.fromString((String) body.get("fromWarehouse"));
        UUID toWarehouse = UUID.fromString((String) body.get("toWarehouse"));
        String sku = (String) body.get("sku");
        BigDecimal quantity = new BigDecimal(body.get("quantity").toString());

        Map<String, Object> transfer = transferService.createTransfer(fromWarehouse, toWarehouse, sku, quantity);
        return ResponseEntity.status(HttpStatus.CREATED).body(transfer);
    }

    @PatchMapping("/{id}/transit")
    @PreAuthorize("hasAnyRole('WAREHOUSE_MANAGER', 'ADMIN')")
    public ResponseEntity<Void> recordTransitTransfer(@PathVariable UUID id) {
        transferService.recordTransitTransfer(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/receive")
    @PreAuthorize("hasAnyRole('WAREHOUSE_MANAGER', 'ADMIN')")
    public ResponseEntity<Void> receiveTransfer(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        BigDecimal quantityReceived = new BigDecimal(body.get("quantityReceived").toString());
        transferService.receiveTransfer(id, quantityReceived);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{sku}/bin-suggestion")
    @PreAuthorize("hasAnyRole('WAREHOUSE_MANAGER', 'INVENTORY_MANAGER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getBinSuggestion(
            @PathVariable String sku,
            @RequestParam(required = false) UUID warehouseId) {
        Map<String, Object> suggestion = transferService.getBinSuggestion(sku, warehouseId);
        return ResponseEntity.ok(suggestion);
    }
}
