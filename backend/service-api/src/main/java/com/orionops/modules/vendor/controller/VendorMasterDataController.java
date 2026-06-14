package com.orionops.modules.vendor.controller;

import com.orionops.modules.vendor.service.VendorMasterDataService;
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
@RequestMapping("/api/v1/vendor-mdm")
@RequiredArgsConstructor
@Tag(name = "Vendor Master Data", description = "Vendor data management and quality")
public class VendorMasterDataController {

    private final VendorMasterDataService vendorMdmService;

    @GetMapping("/vendors/{id}/duplicates")
    @PreAuthorize("hasAnyRole('PROCUREMENT_MANAGER', 'ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getVendorDuplicates(@PathVariable UUID id) {
        List<Map<String, Object>> duplicates = vendorMdmService.suggestDuplicateVendors(id);
        return ResponseEntity.ok(duplicates);
    }

    @PostMapping("/vendors/consolidate")
    @PreAuthorize("hasAnyRole('PROCUREMENT_MANAGER', 'ADMIN')")
    public ResponseEntity<Void> consolidateVendors(@RequestBody Map<String, Object> body) {
        UUID primaryVendorId = UUID.fromString((String) body.get("primaryVendorId"));
        @SuppressWarnings("unchecked")
        List<UUID> duplicateVendorIds = (List<UUID>) body.get("duplicateVendorIds");
        vendorMdmService.consolidateVendors(primaryVendorId, duplicateVendorIds);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/vendors/{id}/quality-score")
    @PreAuthorize("hasAnyRole('PROCUREMENT_VIEWER', 'PROCUREMENT_MANAGER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getVendorQualityScore(@PathVariable UUID id) {
        Map<String, Object> score = vendorMdmService.calculateDataQualityScore(id);
        return ResponseEntity.ok(score);
    }

    @PostMapping("/vendors/{id}/audit")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<Void> auditVendorChange(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body) {
        String fieldName = (String) body.get("fieldName");
        Object oldValue = body.get("oldValue");
        Object newValue = body.get("newValue");
        UUID changedBy = UUID.fromString((String) body.get("changedBy"));
        vendorMdmService.auditVendorChange(id, fieldName, oldValue, newValue, changedBy);
        return ResponseEntity.ok().build();
    }
}
