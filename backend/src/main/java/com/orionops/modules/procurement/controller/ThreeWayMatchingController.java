package com.orionops.modules.procurement.controller;

import com.orionops.modules.procurement.service.ThreeWayMatchingService;
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
@RequestMapping("/api/v1/procurement/matching")
@RequiredArgsConstructor
@Tag(name = "Three-Way Matching", description = "Invoice-PO-Receipt matching")
public class ThreeWayMatchingController {

    private final ThreeWayMatchingService matchingService;

    @PostMapping("/receipts")
    @PreAuthorize("hasAnyRole('PROCUREMENT_MANAGER', 'WAREHOUSE_MANAGER', 'ADMIN')")
    public ResponseEntity<Void> recordGoodsReceipt(@RequestBody Map<String, Object> body) {
        UUID poId = UUID.fromString((String) body.get("poId"));
        matchingService.recordGoodsReceipt(poId, body);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/match")
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER', 'PROCUREMENT_MANAGER', 'ADMIN')")
    public ResponseEntity<Void> matchInvoice(@RequestBody Map<String, Object> body) {
        UUID invoiceId = UUID.fromString((String) body.get("invoiceId"));
        UUID poId = UUID.fromString((String) body.get("poId"));
        UUID receiptId = UUID.fromString((String) body.get("receiptId"));
        matchingService.matchInvoiceToReceiptAndPO(invoiceId, poId, receiptId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/variances/{invoiceId}")
    @PreAuthorize("hasAnyRole('FINANCE_VIEWER', 'FINANCE_MANAGER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> detectVariances(@PathVariable UUID invoiceId) {
        Map<String, Object> variances = matchingService.detectVariances(invoiceId);
        return ResponseEntity.ok(variances);
    }

    @PostMapping("/flag")
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER', 'ADMIN')")
    public ResponseEntity<Void> flagMatchingException(@RequestBody Map<String, Object> body) {
        UUID invoiceId = UUID.fromString((String) body.get("invoiceId"));
        String reason = (String) body.get("reason");
        matchingService.flagMatchingException(invoiceId, reason);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/resolve/{invoiceId}")
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER', 'ADMIN')")
    public ResponseEntity<Void> resolveVariance(@PathVariable UUID invoiceId, @RequestBody Map<String, Object> body) {
        String resolution = (String) body.get("resolution");
        matchingService.resolveVariance(invoiceId, resolution);
        return ResponseEntity.ok().build();
    }
}
