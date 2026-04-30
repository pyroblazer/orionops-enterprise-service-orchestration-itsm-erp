package com.orionops.modules.procurement.controller;

import com.orionops.common.dto.ApiResponse;
import com.orionops.modules.procurement.dto.ProcurementRequest;
import com.orionops.modules.procurement.dto.ProcurementResponse;
import com.orionops.modules.procurement.service.ProcurementService;
import io.swagger.v3.oas.annotations.Operation;
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

    @GetMapping("/requests/{id}")
    @Operation(summary = "Get purchase request", description = "Retrieves a purchase request by ID")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'PROCUREMENT')")
    public ResponseEntity<ApiResponse<ProcurementResponse.PRResponse>> getPR(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(procurementService.getPR(id)));
    }

    @PutMapping("/requests/{id}")
    @Operation(summary = "Update purchase request", description = "Updates an existing purchase request")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'PROCUREMENT')")
    public ResponseEntity<ApiResponse<ProcurementResponse.PRResponse>> updatePR(
            @PathVariable UUID id, @Valid @RequestBody ProcurementRequest.PRRequest request) {
        return ResponseEntity.ok(ApiResponse.success(procurementService.updatePR(id, request), "Purchase request updated"));
    }

    @DeleteMapping("/requests/{id}")
    @Operation(summary = "Delete purchase request", description = "Soft-deletes a purchase request")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deletePR(@PathVariable UUID id) {
        procurementService.deletePR(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Purchase request deleted"));
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

    @GetMapping("/orders/{id}")
    @Operation(summary = "Get purchase order", description = "Retrieves a purchase order by ID")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'PROCUREMENT')")
    public ResponseEntity<ApiResponse<ProcurementResponse.POResponse>> getPO(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(procurementService.getPO(id)));
    }

    @PutMapping("/orders/{id}")
    @Operation(summary = "Update purchase order", description = "Updates an existing purchase order")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'PROCUREMENT')")
    public ResponseEntity<ApiResponse<ProcurementResponse.POResponse>> updatePO(
            @PathVariable UUID id, @Valid @RequestBody ProcurementRequest.PORequest request) {
        return ResponseEntity.ok(ApiResponse.success(procurementService.updatePO(id, request), "Purchase order updated"));
    }

    @DeleteMapping("/orders/{id}")
    @Operation(summary = "Delete purchase order", description = "Soft-deletes a purchase order")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deletePO(@PathVariable UUID id) {
        procurementService.deletePO(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Purchase order deleted"));
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

    @GetMapping("/vendors/{id}")
    @Operation(summary = "Get procurement vendor", description = "Retrieves a procurement vendor by ID")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'PROCUREMENT')")
    public ResponseEntity<ApiResponse<ProcurementResponse.VendorResponse>> getVendor(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(procurementService.getVendor(id)));
    }

    @PutMapping("/vendors/{id}")
    @Operation(summary = "Update procurement vendor", description = "Updates an existing procurement vendor")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'PROCUREMENT')")
    public ResponseEntity<ApiResponse<ProcurementResponse.VendorResponse>> updateVendor(
            @PathVariable UUID id, @Valid @RequestBody ProcurementRequest.VendorRequest request) {
        return ResponseEntity.ok(ApiResponse.success(procurementService.updateVendor(id, request), "Vendor updated"));
    }

    @DeleteMapping("/vendors/{id}")
    @Operation(summary = "Delete procurement vendor", description = "Soft-deletes a procurement vendor")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteVendor(@PathVariable UUID id) {
        procurementService.deleteVendor(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Vendor deleted"));
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

    @GetMapping("/contracts/{id}")
    @Operation(summary = "Get contract", description = "Retrieves a contract by ID")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'PROCUREMENT')")
    public ResponseEntity<ApiResponse<ProcurementResponse.ContractResponse>> getContract(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(procurementService.getContract(id)));
    }

    @PutMapping("/contracts/{id}")
    @Operation(summary = "Update contract", description = "Updates an existing contract")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'PROCUREMENT')")
    public ResponseEntity<ApiResponse<ProcurementResponse.ContractResponse>> updateContract(
            @PathVariable UUID id, @Valid @RequestBody ProcurementRequest.ContractRequest request) {
        return ResponseEntity.ok(ApiResponse.success(procurementService.updateContract(id, request), "Contract updated"));
    }

    @DeleteMapping("/contracts/{id}")
    @Operation(summary = "Delete contract", description = "Soft-deletes a contract")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteContract(@PathVariable UUID id) {
        procurementService.deleteContract(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Contract deleted"));
    }
}
