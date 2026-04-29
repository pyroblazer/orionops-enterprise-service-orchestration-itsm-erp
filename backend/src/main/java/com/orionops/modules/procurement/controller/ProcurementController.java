package com.orionops.modules.procurement.controller;

import com.orionops.common.dto.ApiResponse;
import com.orionops.modules.procurement.dto.ProcurementRequest;
import com.orionops.modules.procurement.dto.ProcurementResponse;
import com.orionops.modules.procurement.service.ProcurementService;
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
@RequestMapping("/api/v1/procurement")
@RequiredArgsConstructor
@Tag(name = "Procurement", description = "Procurement management operations")
public class ProcurementController {

    private final ProcurementService procurementService;

    @PostMapping("/requests")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProcurementResponse.PRResponse>> createPR(@Valid @RequestBody ProcurementRequest.PRRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(procurementService.createPR(request), "Purchase request created"));
    }

    @GetMapping("/requests")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'PROCUREMENT')")
    public ResponseEntity<ApiResponse<List<ProcurementResponse.PRResponse>>> listPRs() {
        return ResponseEntity.ok(ApiResponse.success(procurementService.listPRs()));
    }

    @PostMapping("/requests/{id}/submit")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProcurementResponse.PRResponse>> submitPR(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(procurementService.submitPR(id), "Purchase request submitted"));
    }

    @PostMapping("/requests/{id}/create-po")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'PROCUREMENT')")
    public ResponseEntity<ApiResponse<ProcurementResponse.POResponse>> createPO(
            @PathVariable UUID id, @Valid @RequestBody ProcurementRequest.PORequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(procurementService.createPOFromPR(id, request), "Purchase order created"));
    }

    @GetMapping("/orders")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'PROCUREMENT')")
    public ResponseEntity<ApiResponse<List<ProcurementResponse.POResponse>>> listPOs() {
        return ResponseEntity.ok(ApiResponse.success(procurementService.listPOs()));
    }

    @PostMapping("/vendors")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'PROCUREMENT')")
    public ResponseEntity<ApiResponse<ProcurementResponse.VendorResponse>> createVendor(@Valid @RequestBody ProcurementRequest.VendorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(procurementService.createVendor(request), "Vendor created"));
    }

    @GetMapping("/vendors")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'PROCUREMENT')")
    public ResponseEntity<ApiResponse<List<ProcurementResponse.VendorResponse>>> listVendors() {
        return ResponseEntity.ok(ApiResponse.success(procurementService.listVendors()));
    }

    @PostMapping("/contracts")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'PROCUREMENT')")
    public ResponseEntity<ApiResponse<ProcurementResponse.ContractResponse>> createContract(@Valid @RequestBody ProcurementRequest.ContractRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(procurementService.createContract(request), "Contract created"));
    }

    @GetMapping("/contracts")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'PROCUREMENT')")
    public ResponseEntity<ApiResponse<List<ProcurementResponse.ContractResponse>>> listContracts() {
        return ResponseEntity.ok(ApiResponse.success(procurementService.listContracts()));
    }
}
