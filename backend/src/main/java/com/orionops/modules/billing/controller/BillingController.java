package com.orionops.modules.billing.controller;

import com.orionops.common.dto.ApiResponse;
import com.orionops.modules.billing.dto.BillingDTO;
import com.orionops.modules.billing.service.BillingService;
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
@RequestMapping("/api/v1/billing")
@RequiredArgsConstructor
@Tag(name = "Billing", description = "Billing and chargeback operations")
public class BillingController {

    private final BillingService billingService;

    @PostMapping("/record-usage")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<BillingDTO.UsageResponse>> recordUsage(@Valid @RequestBody BillingDTO.UsageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(billingService.recordUsage(request), "Usage recorded"));
    }

    @PostMapping("/generate-invoice")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    public ResponseEntity<ApiResponse<BillingDTO.BillingRecordResponse>> generateInvoice(@Valid @RequestBody BillingDTO.GenerateInvoiceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(billingService.generateInvoice(request), "Invoice generated"));
    }

    @GetMapping("/usages")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<BillingDTO.UsageResponse>>> listUsages() {
        return ResponseEntity.ok(ApiResponse.success(billingService.listUsages()));
    }

    @GetMapping("/usages/{id}")
    @Operation(summary = "Get usage record", description = "Retrieves a service usage record by ID")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'MANAGER')")
    public ResponseEntity<ApiResponse<BillingDTO.UsageResponse>> getUsage(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(billingService.getUsage(id)));
    }

    @PutMapping("/usages/{id}")
    @Operation(summary = "Update usage record", description = "Updates an existing service usage record")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    public ResponseEntity<ApiResponse<BillingDTO.UsageResponse>> updateUsage(
            @PathVariable UUID id, @Valid @RequestBody BillingDTO.UsageRequest request) {
        return ResponseEntity.ok(ApiResponse.success(billingService.updateUsage(id, request), "Usage updated"));
    }

    @DeleteMapping("/usages/{id}")
    @Operation(summary = "Delete usage record", description = "Soft-deletes a service usage record")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteUsage(@PathVariable UUID id) {
        billingService.deleteUsage(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Usage deleted"));
    }

    @GetMapping("/records")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<BillingDTO.BillingRecordResponse>>> listBillingRecords() {
        return ResponseEntity.ok(ApiResponse.success(billingService.listBillingRecords()));
    }

    @GetMapping("/records/{id}")
    @Operation(summary = "Get billing record", description = "Retrieves a billing record by ID")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'MANAGER')")
    public ResponseEntity<ApiResponse<BillingDTO.BillingRecordResponse>> getBillingRecord(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(billingService.getBillingRecord(id)));
    }

    @DeleteMapping("/records/{id}")
    @Operation(summary = "Delete billing record", description = "Soft-deletes a billing record")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteBillingRecord(@PathVariable UUID id) {
        billingService.deleteBillingRecord(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Billing record deleted"));
    }

    @PostMapping("/cost-models")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    public ResponseEntity<ApiResponse<BillingDTO.CostModelResponse>> createCostModel(@Valid @RequestBody BillingDTO.CostModelRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(billingService.createCostModel(request), "Cost model created"));
    }

    @GetMapping("/cost-models")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<BillingDTO.CostModelResponse>>> listCostModels() {
        return ResponseEntity.ok(ApiResponse.success(billingService.listCostModels()));
    }

    @GetMapping("/cost-models/{id}")
    @Operation(summary = "Get cost model", description = "Retrieves a cost model by ID")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'MANAGER')")
    public ResponseEntity<ApiResponse<BillingDTO.CostModelResponse>> getCostModel(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(billingService.getCostModel(id)));
    }

    @PutMapping("/cost-models/{id}")
    @Operation(summary = "Update cost model", description = "Updates an existing cost model")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    public ResponseEntity<ApiResponse<BillingDTO.CostModelResponse>> updateCostModel(
            @PathVariable UUID id, @Valid @RequestBody BillingDTO.CostModelRequest request) {
        return ResponseEntity.ok(ApiResponse.success(billingService.updateCostModel(id, request), "Cost model updated"));
    }

    @DeleteMapping("/cost-models/{id}")
    @Operation(summary = "Delete cost model", description = "Soft-deletes a cost model")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCostModel(@PathVariable UUID id) {
        billingService.deleteCostModel(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Cost model deleted"));
    }
}
