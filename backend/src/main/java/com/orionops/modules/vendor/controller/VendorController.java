package com.orionops.modules.vendor.controller;

import com.orionops.common.dto.ApiResponse;
import com.orionops.modules.vendor.dto.VendorDTO;
import com.orionops.modules.vendor.service.VendorService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/vendors")
@RequiredArgsConstructor
@Tag(name = "Vendors", description = "Vendor management")
public class VendorController {

    private final VendorService vendorService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<VendorDTO.VendorResponse>> createVendor(@Valid @RequestBody VendorDTO.VendorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(vendorService.createVendor(request), "Vendor created"));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'AGENT')")
    public ResponseEntity<ApiResponse<List<VendorDTO.VendorResponse>>> listVendors() {
        return ResponseEntity.ok(ApiResponse.success(vendorService.listVendors()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'AGENT')")
    public ResponseEntity<ApiResponse<VendorDTO.VendorResponse>> getVendor(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(vendorService.getVendor(id)));
    }

    @GetMapping("/{id}/performance")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<VendorDTO.PerformanceResponse>>> getPerformance(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(vendorService.getVendorPerformance(id)));
    }

    @PostMapping("/{id}/performance")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<VendorDTO.PerformanceResponse>> recordPerformance(
            @PathVariable UUID id, @Valid @RequestBody VendorDTO.PerformanceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(vendorService.recordPerformance(id, request), "Performance recorded"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteVendor(@PathVariable UUID id) {
        vendorService.deleteVendor(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Vendor deleted"));
    }
}
