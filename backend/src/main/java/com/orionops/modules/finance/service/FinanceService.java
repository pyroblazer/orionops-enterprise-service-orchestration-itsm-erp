package com.orionops.modules.finance.service;

import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.modules.finance.dto.FinanceRequest;
import com.orionops.modules.finance.dto.FinanceResponse;
import com.orionops.modules.finance.entity.Budget;
import com.orionops.modules.finance.entity.CostCenter;
import com.orionops.modules.finance.entity.Expense;
import com.orionops.modules.finance.entity.Invoice;
import com.orionops.modules.finance.entity.PaymentRecord;
import com.orionops.modules.finance.repository.FinanceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FinanceService {

    private final FinanceRepository.BudgetRepository budgetRepository;
    private final FinanceRepository.CostCenterRepository costCenterRepository;
    private final FinanceRepository.ExpenseRepository expenseRepository;
    private final FinanceRepository.InvoiceRepository invoiceRepository;
    private final FinanceRepository.PaymentRecordRepository paymentRecordRepository;

    // --- Budget ---
    @Transactional
    public FinanceResponse.BudgetResponse createBudget(FinanceRequest.BudgetRequest request) {
        Budget budget = Budget.builder()
                .name(request.getName()).description(request.getDescription())
                .totalAmount(request.getTotalAmount()).startDate(request.getStartDate())
                .endDate(request.getEndDate()).fiscalYear(request.getFiscalYear())
                .costCenterId(request.getCostCenterId()).tenantId(resolveTenantId()).build();
        return mapBudgetToResponse(budgetRepository.save(budget));
    }

    @Transactional(readOnly = true)
    public List<FinanceResponse.BudgetResponse> listBudgets() {
        return budgetRepository.findByTenantIdAndDeletedAtIsNull(resolveTenantId())
                .stream().map(this::mapBudgetToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FinanceResponse.BudgetResponse getBudget(UUID id) {
        return mapBudgetToResponse(findBudgetOrThrow(id));
    }

    @Transactional(readOnly = true)
    public FinanceResponse.BudgetResponse getBudgetUtilization(UUID id) {
        Budget budget = findBudgetOrThrow(id);
        List<Expense> expenses = expenseRepository.findByBudgetIdAndDeletedAtIsNull(id);
        BigDecimal totalSpent = expenses.stream()
                .filter(e -> e.getStatus() == Expense.ExpenseStatus.APPROVED || e.getStatus() == Expense.ExpenseStatus.PAID)
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        budget.setSpentAmount(totalSpent);
        return mapBudgetToResponse(budget);
    }

    @Transactional
    public void deleteBudget(UUID id) {
        Budget budget = findBudgetOrThrow(id);
        budget.softDelete();
        budgetRepository.save(budget);
    }

    // --- CostCenter ---
    @Transactional
    public FinanceResponse.CostCenterResponse createCostCenter(FinanceRequest.CostCenterRequest request) {
        CostCenter cc = CostCenter.builder()
                .name(request.getName()).code(request.getCode())
                .description(request.getDescription()).owner(request.getOwner())
                .tenantId(resolveTenantId()).build();
        return mapCostCenterToResponse(costCenterRepository.save(cc));
    }

    @Transactional(readOnly = true)
    public List<FinanceResponse.CostCenterResponse> listCostCenters() {
        return costCenterRepository.findByTenantIdAndDeletedAtIsNull(resolveTenantId())
                .stream().map(this::mapCostCenterToResponse).collect(Collectors.toList());
    }

    // --- Expense ---
    @Transactional
    public FinanceResponse.ExpenseResponse createExpense(FinanceRequest.ExpenseRequest request) {
        Expense expense = Expense.builder()
                .description(request.getDescription()).amount(request.getAmount())
                .budgetId(request.getBudgetId()).costCenterId(request.getCostCenterId())
                .category(request.getCategory()).expenseDate(request.getExpenseDate())
                .submittedBy(request.getSubmittedBy()).tenantId(resolveTenantId()).build();
        return mapExpenseToResponse(expenseRepository.save(expense));
    }

    @Transactional(readOnly = true)
    public List<FinanceResponse.ExpenseResponse> listExpenses() {
        return expenseRepository.findByTenantIdAndDeletedAtIsNull(resolveTenantId())
                .stream().map(this::mapExpenseToResponse).collect(Collectors.toList());
    }

    // --- Invoice ---
    @Transactional
    public FinanceResponse.InvoiceResponse createInvoice(FinanceRequest.InvoiceRequest request) {
        Invoice invoice = Invoice.builder()
                .invoiceNumber(request.getInvoiceNumber()).vendorId(request.getVendorId())
                .amount(request.getAmount()).taxAmount(request.getTaxAmount())
                .invoiceDate(request.getInvoiceDate()).dueDate(request.getDueDate())
                .description(request.getDescription()).tenantId(resolveTenantId()).build();
        return mapInvoiceToResponse(invoiceRepository.save(invoice));
    }

    @Transactional(readOnly = true)
    public List<FinanceResponse.InvoiceResponse> listInvoices() {
        return invoiceRepository.findByTenantIdAndDeletedAtIsNull(resolveTenantId())
                .stream().map(this::mapInvoiceToResponse).collect(Collectors.toList());
    }

    // --- PaymentRecord ---
    @Transactional
    public FinanceResponse.PaymentResponse createPayment(FinanceRequest.PaymentRequest request) {
        PaymentRecord payment = PaymentRecord.builder()
                .invoiceId(request.getInvoiceId()).amount(request.getAmount())
                .paymentDate(request.getPaymentDate()).method(request.getMethod())
                .reference(request.getReference()).notes(request.getNotes())
                .tenantId(resolveTenantId()).build();
        return mapPaymentToResponse(paymentRecordRepository.save(payment));
    }

    @Transactional(readOnly = true)
    public List<FinanceResponse.PaymentResponse> listPayments() {
        return paymentRecordRepository.findByTenantIdAndDeletedAtIsNull(resolveTenantId())
                .stream().map(this::mapPaymentToResponse).collect(Collectors.toList());
    }

    private Budget findBudgetOrThrow(UUID id) {
        return budgetRepository.findById(id).filter(b -> !b.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Budget", id));
    }

    private UUID resolveTenantId() {
        return UUID.fromString("00000000-0000-0000-0000-000000000001");
    }

    private FinanceResponse.BudgetResponse mapBudgetToResponse(Budget b) {
        BigDecimal utilization = b.getTotalAmount().compareTo(BigDecimal.ZERO) > 0
                ? b.getSpentAmount().multiply(BigDecimal.valueOf(100)).divide(b.getTotalAmount(), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        return FinanceResponse.BudgetResponse.builder()
                .id(b.getId()).name(b.getName()).description(b.getDescription())
                .totalAmount(b.getTotalAmount()).spentAmount(b.getSpentAmount())
                .committedAmount(b.getCommittedAmount()).startDate(b.getStartDate())
                .endDate(b.getEndDate()).fiscalYear(b.getFiscalYear())
                .costCenterId(b.getCostCenterId()).utilizationPercentage(utilization)
                .createdAt(b.getCreatedAt()).updatedAt(b.getUpdatedAt()).build();
    }

    private FinanceResponse.CostCenterResponse mapCostCenterToResponse(CostCenter c) {
        return FinanceResponse.CostCenterResponse.builder()
                .id(c.getId()).name(c.getName()).code(c.getCode())
                .description(c.getDescription()).owner(c.getOwner()).active(c.isActive())
                .createdAt(c.getCreatedAt()).build();
    }

    private FinanceResponse.ExpenseResponse mapExpenseToResponse(Expense e) {
        return FinanceResponse.ExpenseResponse.builder()
                .id(e.getId()).description(e.getDescription()).amount(e.getAmount())
                .budgetId(e.getBudgetId()).costCenterId(e.getCostCenterId())
                .category(e.getCategory() != null ? e.getCategory().name() : null)
                .expenseDate(e.getExpenseDate()).submittedBy(e.getSubmittedBy())
                .status(e.getStatus().name()).createdAt(e.getCreatedAt()).build();
    }

    private FinanceResponse.InvoiceResponse mapInvoiceToResponse(Invoice i) {
        return FinanceResponse.InvoiceResponse.builder()
                .id(i.getId()).invoiceNumber(i.getInvoiceNumber()).vendorId(i.getVendorId())
                .amount(i.getAmount()).taxAmount(i.getTaxAmount())
                .invoiceDate(i.getInvoiceDate()).dueDate(i.getDueDate()).paidDate(i.getPaidDate())
                .status(i.getStatus().name()).description(i.getDescription())
                .createdAt(i.getCreatedAt()).build();
    }

    private FinanceResponse.PaymentResponse mapPaymentToResponse(PaymentRecord p) {
        return FinanceResponse.PaymentResponse.builder()
                .id(p.getId()).invoiceId(p.getInvoiceId()).amount(p.getAmount())
                .paymentDate(p.getPaymentDate()).method(p.getMethod() != null ? p.getMethod().name() : null)
                .reference(p.getReference()).notes(p.getNotes()).createdAt(p.getCreatedAt()).build();
    }
}
