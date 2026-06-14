package com.orionops.modules.finance.controller;

import com.orionops.common.dto.ApiResponse;
import com.orionops.modules.finance.dto.FinanceRequest;
import com.orionops.modules.finance.dto.FinanceResponse;
import com.orionops.modules.finance.service.FinanceService;
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
@RequestMapping("/api/v1/finance")
@RequiredArgsConstructor
@Tag(name = "Finance", description = "Financial management operations")
public class FinanceController {

    private final FinanceService financeService;

    // --- Budgets ---
    @PostMapping("/budgets")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    public ResponseEntity<ApiResponse<FinanceResponse.BudgetResponse>> createBudget(@Valid @RequestBody FinanceRequest.BudgetRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(financeService.createBudget(request), "Budget created"));
    }

    @GetMapping("/budgets")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<FinanceResponse.BudgetResponse>>> listBudgets() {
        return ResponseEntity.ok(ApiResponse.success(financeService.listBudgets()));
    }

    @GetMapping("/budgets/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'MANAGER')")
    public ResponseEntity<ApiResponse<FinanceResponse.BudgetResponse>> getBudget(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(financeService.getBudget(id)));
    }

    @GetMapping("/budgets/{id}/utilization")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'MANAGER')")
    public ResponseEntity<ApiResponse<FinanceResponse.BudgetResponse>> getBudgetUtilization(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(financeService.getBudgetUtilization(id)));
    }

    @PutMapping("/budgets/{id}")
    @Operation(summary = "Update budget", description = "Updates an existing budget")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    public ResponseEntity<ApiResponse<FinanceResponse.BudgetResponse>> updateBudget(
            @PathVariable UUID id, @Valid @RequestBody FinanceRequest.BudgetRequest request) {
        return ResponseEntity.ok(ApiResponse.success(financeService.updateBudget(id, request), "Budget updated"));
    }

    @DeleteMapping("/budgets/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteBudget(@PathVariable UUID id) {
        financeService.deleteBudget(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Budget deleted"));
    }

    // --- Cost Centers ---
    @PostMapping("/cost-centers")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    public ResponseEntity<ApiResponse<FinanceResponse.CostCenterResponse>> createCostCenter(@Valid @RequestBody FinanceRequest.CostCenterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(financeService.createCostCenter(request), "Cost center created"));
    }

    @GetMapping("/cost-centers")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<FinanceResponse.CostCenterResponse>>> listCostCenters() {
        return ResponseEntity.ok(ApiResponse.success(financeService.listCostCenters()));
    }

    @GetMapping("/cost-centers/{id}")
    @Operation(summary = "Get cost center", description = "Retrieves a cost center by ID")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'MANAGER')")
    public ResponseEntity<ApiResponse<FinanceResponse.CostCenterResponse>> getCostCenter(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(financeService.getCostCenter(id)));
    }

    @PutMapping("/cost-centers/{id}")
    @Operation(summary = "Update cost center", description = "Updates an existing cost center")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    public ResponseEntity<ApiResponse<FinanceResponse.CostCenterResponse>> updateCostCenter(
            @PathVariable UUID id, @Valid @RequestBody FinanceRequest.CostCenterRequest request) {
        return ResponseEntity.ok(ApiResponse.success(financeService.updateCostCenter(id, request), "Cost center updated"));
    }

    @DeleteMapping("/cost-centers/{id}")
    @Operation(summary = "Delete cost center", description = "Soft-deletes a cost center")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCostCenter(@PathVariable UUID id) {
        financeService.deleteCostCenter(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Cost center deleted"));
    }

    // --- Expenses ---
    @PostMapping("/expenses")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<FinanceResponse.ExpenseResponse>> createExpense(@Valid @RequestBody FinanceRequest.ExpenseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(financeService.createExpense(request), "Expense created"));
    }

    @GetMapping("/expenses")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<FinanceResponse.ExpenseResponse>>> listExpenses() {
        return ResponseEntity.ok(ApiResponse.success(financeService.listExpenses()));
    }

    @GetMapping("/expenses/{id}")
    @Operation(summary = "Get expense", description = "Retrieves an expense by ID")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'MANAGER')")
    public ResponseEntity<ApiResponse<FinanceResponse.ExpenseResponse>> getExpense(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(financeService.getExpense(id)));
    }

    @PutMapping("/expenses/{id}")
    @Operation(summary = "Update expense", description = "Updates an existing expense")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    public ResponseEntity<ApiResponse<FinanceResponse.ExpenseResponse>> updateExpense(
            @PathVariable UUID id, @Valid @RequestBody FinanceRequest.ExpenseRequest request) {
        return ResponseEntity.ok(ApiResponse.success(financeService.updateExpense(id, request), "Expense updated"));
    }

    @DeleteMapping("/expenses/{id}")
    @Operation(summary = "Delete expense", description = "Soft-deletes an expense")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteExpense(@PathVariable UUID id) {
        financeService.deleteExpense(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Expense deleted"));
    }

    // --- Invoices ---
    @PostMapping("/invoices")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    public ResponseEntity<ApiResponse<FinanceResponse.InvoiceResponse>> createInvoice(@Valid @RequestBody FinanceRequest.InvoiceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(financeService.createInvoice(request), "Invoice created"));
    }

    @GetMapping("/invoices")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<FinanceResponse.InvoiceResponse>>> listInvoices() {
        return ResponseEntity.ok(ApiResponse.success(financeService.listInvoices()));
    }

    @GetMapping("/invoices/{id}")
    @Operation(summary = "Get invoice", description = "Retrieves an invoice by ID")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'MANAGER')")
    public ResponseEntity<ApiResponse<FinanceResponse.InvoiceResponse>> getInvoice(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(financeService.getInvoice(id)));
    }

    @PutMapping("/invoices/{id}")
    @Operation(summary = "Update invoice", description = "Updates an existing invoice")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    public ResponseEntity<ApiResponse<FinanceResponse.InvoiceResponse>> updateInvoice(
            @PathVariable UUID id, @Valid @RequestBody FinanceRequest.InvoiceRequest request) {
        return ResponseEntity.ok(ApiResponse.success(financeService.updateInvoice(id, request), "Invoice updated"));
    }

    @DeleteMapping("/invoices/{id}")
    @Operation(summary = "Delete invoice", description = "Soft-deletes an invoice")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteInvoice(@PathVariable UUID id) {
        financeService.deleteInvoice(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Invoice deleted"));
    }

    // --- Payments ---
    @PostMapping("/payments")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    public ResponseEntity<ApiResponse<FinanceResponse.PaymentResponse>> createPayment(@Valid @RequestBody FinanceRequest.PaymentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(financeService.createPayment(request), "Payment recorded"));
    }

    @GetMapping("/payments")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    public ResponseEntity<ApiResponse<List<FinanceResponse.PaymentResponse>>> listPayments() {
        return ResponseEntity.ok(ApiResponse.success(financeService.listPayments()));
    }

    @GetMapping("/payments/{id}")
    @Operation(summary = "Get payment", description = "Retrieves a payment record by ID")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    public ResponseEntity<ApiResponse<FinanceResponse.PaymentResponse>> getPayment(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(financeService.getPayment(id)));
    }

    @PutMapping("/payments/{id}")
    @Operation(summary = "Update payment", description = "Updates an existing payment record")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    public ResponseEntity<ApiResponse<FinanceResponse.PaymentResponse>> updatePayment(
            @PathVariable UUID id, @Valid @RequestBody FinanceRequest.PaymentRequest request) {
        return ResponseEntity.ok(ApiResponse.success(financeService.updatePayment(id, request), "Payment updated"));
    }

    @DeleteMapping("/payments/{id}")
    @Operation(summary = "Delete payment", description = "Soft-deletes a payment record")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deletePayment(@PathVariable UUID id) {
        financeService.deletePayment(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Payment deleted"));
    }
}
