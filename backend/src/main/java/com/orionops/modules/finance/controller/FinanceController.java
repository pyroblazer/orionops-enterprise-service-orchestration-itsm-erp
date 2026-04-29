package com.orionops.modules.finance.controller;

import com.orionops.common.dto.ApiResponse;
import com.orionops.modules.finance.dto.FinanceRequest;
import com.orionops.modules.finance.dto.FinanceResponse;
import com.orionops.modules.finance.service.FinanceService;
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
}
