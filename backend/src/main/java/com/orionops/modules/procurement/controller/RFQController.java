package com.orionops.modules.procurement.controller;

import com.orionops.modules.procurement.service.RFQService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.preauthorize.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/procurement/rfq")
@RequiredArgsConstructor
@Tag(name = "RFQ Management", description = "Request for Quotation operations")
public class RFQController {

    private final RFQService rfqService;

    @PostMapping
    @PreAuthorize("hasAnyRole('PROCUREMENT_MANAGER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> createRFQ(@RequestBody Map<String, Object> body) {
        Map<String, Object> rfq = rfqService.createRFQ(body);
        return ResponseEntity.status(HttpStatus.CREATED).body(rfq);
    }

    @PostMapping("/{id}/send")
    @PreAuthorize("hasAnyRole('PROCUREMENT_MANAGER', 'ADMIN')")
    public ResponseEntity<Void> sendRFQToVendors(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<UUID> vendorIds = (List<UUID>) body.get("vendorIds");
        rfqService.sendRFQToVendors(id, vendorIds);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/bids")
    @PreAuthorize("hasAnyRole('PROCUREMENT_MANAGER', 'VENDOR', 'ADMIN')")
    public ResponseEntity<Void> recordBid(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        rfqService.recordBidResponse(id, body);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/score")
    @PreAuthorize("hasAnyRole('PROCUREMENT_VIEWER', 'PROCUREMENT_MANAGER', 'ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> scoreAndRankBids(@PathVariable UUID id) {
        List<Map<String, Object>> bids = rfqService.scoreAndRankBids(id);
        return ResponseEntity.ok(bids);
    }

    @PostMapping("/{id}/award")
    @PreAuthorize("hasAnyRole('PROCUREMENT_MANAGER', 'ADMIN')")
    public ResponseEntity<Void> awardRFQ(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        UUID winningVendorId = UUID.fromString((String) body.get("winningVendorId"));
        rfqService.awardRFQ(id, winningVendorId);
        return ResponseEntity.ok().build();
    }
}
