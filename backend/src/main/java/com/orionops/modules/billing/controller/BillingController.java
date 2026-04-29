package com.orionops.modules.billing.controller;

import com.orionops.common.dto.ApiResponse;
import com.orionops.modules.billing.dto.BillingDTO;
import com.orionops.modules.billing.service.BillingService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping("/records")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<BillingDTO.BillingRecordResponse>>> listBillingRecords() {
        return ResponseEntity.ok(ApiResponse.success(billingService.listBillingRecords()));
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
}
