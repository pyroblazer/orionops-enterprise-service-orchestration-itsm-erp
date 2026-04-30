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
    public FinanceResponse.BudgetResponse updateBudget(UUID id, FinanceRequest.BudgetRequest request) {
        Budget budget = findBudgetOrThrow(id);
        budget.setName(request.getName());
        budget.setDescription(request.getDescription());
        budget.setTotalAmount(request.getTotalAmount());
        budget.setStartDate(request.getStartDate());
        budget.setEndDate(request.getEndDate());
        budget.setFiscalYear(request.getFiscalYear());
        budget.setCostCenterId(request.getCostCenterId());
        return mapBudgetToResponse(budgetRepository.save(budget));
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

    @Transactional(readOnly = true)
    public FinanceResponse.CostCenterResponse getCostCenter(UUID id) {
        return mapCostCenterToResponse(findCostCenterOrThrow(id));
    }

    @Transactional
    public FinanceResponse.CostCenterResponse updateCostCenter(UUID id, FinanceRequest.CostCenterRequest request) {
        CostCenter cc = findCostCenterOrThrow(id);
        cc.setName(request.getName());
        cc.setCode(request.getCode());
        cc.setDescription(request.getDescription());
        cc.setOwner(request.getOwner());
        return mapCostCenterToResponse(costCenterRepository.save(cc));
    }

    @Transactional
    public void deleteCostCenter(UUID id) {
        CostCenter cc = findCostCenterOrThrow(id);
        cc.softDelete();
        costCenterRepository.save(cc);
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

    @Transactional(readOnly = true)
    public FinanceResponse.ExpenseResponse getExpense(UUID id) {
        return mapExpenseToResponse(findExpenseOrThrow(id));
    }

    @Transactional
    public FinanceResponse.ExpenseResponse updateExpense(UUID id, FinanceRequest.ExpenseRequest request) {
        Expense expense = findExpenseOrThrow(id);
        expense.setDescription(request.getDescription());
        expense.setAmount(request.getAmount());
        expense.setBudgetId(request.getBudgetId());
        expense.setCostCenterId(request.getCostCenterId());
        expense.setCategory(request.getCategory());
        expense.setExpenseDate(request.getExpenseDate());
        expense.setSubmittedBy(request.getSubmittedBy());
        return mapExpenseToResponse(expenseRepository.save(expense));
    }

    @Transactional
    public void deleteExpense(UUID id) {
        Expense expense = findExpenseOrThrow(id);
        expense.softDelete();
        expenseRepository.save(expense);
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

    @Transactional(readOnly = true)
    public FinanceResponse.InvoiceResponse getInvoice(UUID id) {
        return mapInvoiceToResponse(findInvoiceOrThrow(id));
    }

    @Transactional
    public FinanceResponse.InvoiceResponse updateInvoice(UUID id, FinanceRequest.InvoiceRequest request) {
        Invoice invoice = findInvoiceOrThrow(id);
        invoice.setInvoiceNumber(request.getInvoiceNumber());
        invoice.setVendorId(request.getVendorId());
        invoice.setAmount(request.getAmount());
        invoice.setTaxAmount(request.getTaxAmount());
        invoice.setInvoiceDate(request.getInvoiceDate());
        invoice.setDueDate(request.getDueDate());
        invoice.setDescription(request.getDescription());
        return mapInvoiceToResponse(invoiceRepository.save(invoice));
    }

    @Transactional
    public void deleteInvoice(UUID id) {
        Invoice invoice = findInvoiceOrThrow(id);
        invoice.softDelete();
        invoiceRepository.save(invoice);
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

    @Transactional(readOnly = true)
    public FinanceResponse.PaymentResponse getPayment(UUID id) {
        return mapPaymentToResponse(findPaymentOrThrow(id));
    }

    @Transactional
    public FinanceResponse.PaymentResponse updatePayment(UUID id, FinanceRequest.PaymentRequest request) {
        PaymentRecord payment = findPaymentOrThrow(id);
        payment.setInvoiceId(request.getInvoiceId());
        payment.setAmount(request.getAmount());
        payment.setPaymentDate(request.getPaymentDate());
        payment.setMethod(request.getMethod());
        payment.setReference(request.getReference());
        payment.setNotes(request.getNotes());
        return mapPaymentToResponse(paymentRecordRepository.save(payment));
    }

    @Transactional
    public void deletePayment(UUID id) {
        PaymentRecord payment = findPaymentOrThrow(id);
        payment.softDelete();
        paymentRecordRepository.save(payment);
    }

    private Budget findBudgetOrThrow(UUID id) {
        return budgetRepository.findById(id).filter(b -> !b.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Budget", id));
    }

    private CostCenter findCostCenterOrThrow(UUID id) {
        return costCenterRepository.findById(id).filter(c -> !c.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("CostCenter", id));
    }

    private Expense findExpenseOrThrow(UUID id) {
        return expenseRepository.findById(id).filter(e -> !e.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Expense", id));
    }

    private Invoice findInvoiceOrThrow(UUID id) {
        return invoiceRepository.findById(id).filter(i -> !i.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", id));
    }

    private PaymentRecord findPaymentOrThrow(UUID id) {
        return paymentRecordRepository.findById(id).filter(p -> !p.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("PaymentRecord", id));
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
