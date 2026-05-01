package com.orionops.modules.finance.service;

import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.modules.finance.dto.FinanceRequest;
import com.orionops.modules.finance.dto.FinanceResponse;
import com.orionops.modules.finance.entity.Budget;
import com.orionops.modules.finance.entity.Expense;
import com.orionops.modules.finance.entity.Invoice;
import com.orionops.modules.finance.repository.FinanceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link FinanceService}.
 * Covers Budget CRUD, Expense CRUD, budget utilization calculation, and Invoice operations.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FinanceService")
class FinanceServiceTest {

    @Mock
    private FinanceRepository.BudgetRepository budgetRepository;

    @Mock
    private FinanceRepository.CostCenterRepository costCenterRepository;

    @Mock
    private FinanceRepository.ExpenseRepository expenseRepository;

    @Mock
    private FinanceRepository.InvoiceRepository invoiceRepository;

    @Mock
    private FinanceRepository.PaymentRecordRepository paymentRecordRepository;

    @InjectMocks
    private FinanceService financeService;

    private UUID tenantId;
    private Budget testBudget;

    @BeforeEach
    void setUp() {
        tenantId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        testBudget = Budget.builder()
                .name("Q1 2026 Budget")
                .description("First quarter budget")
                .totalAmount(new BigDecimal("100000.00"))
                .spentAmount(BigDecimal.ZERO)
                .committedAmount(BigDecimal.ZERO)
                .fiscalYear("2026")
                .build();
        testBudget.setTenantId(tenantId);
        testBudget.setId(UUID.randomUUID());
        testBudget.setCreatedAt(LocalDateTime.now());
        testBudget.setUpdatedAt(LocalDateTime.now());
        testBudget.setCreatedBy("cfo");
    }

    @Nested
    @DisplayName("createBudget")
    class CreateBudgetTests {

        @Test
        @DisplayName("should create budget with valid fields")
        void shouldCreateBudget_whenValidRequest_givenAllFields() {
            FinanceRequest.BudgetRequest request = FinanceRequest.BudgetRequest.builder()
                    .name("Annual Budget")
                    .description("2026 annual budget")
                    .totalAmount(new BigDecimal("500000.00"))
                    .fiscalYear("2026")
                    .build();

            when(budgetRepository.save(any(Budget.class))).thenAnswer(invocation -> {
                Budget b = invocation.getArgument(0);
                b.setId(UUID.randomUUID());
                b.setCreatedAt(LocalDateTime.now());
                b.setUpdatedAt(LocalDateTime.now());
                return b;
            });

            FinanceResponse.BudgetResponse response = financeService.createBudget(request);

            assertThat(response).isNotNull();
            assertThat(response.getName()).isEqualTo("Annual Budget");
            assertThat(response.getTotalAmount()).isEqualByComparingTo(new BigDecimal("500000.00"));
        }
    }

    @Nested
    @DisplayName("getBudget")
    class GetBudgetTests {

        @Test
        @DisplayName("should return budget by ID")
        void shouldReturnBudget_whenFound_givenValidId() {
            when(budgetRepository.findById(testBudget.getId())).thenReturn(Optional.of(testBudget));

            FinanceResponse.BudgetResponse response = financeService.getBudget(testBudget.getId());

            assertThat(response).isNotNull();
            assertThat(response.getName()).isEqualTo("Q1 2026 Budget");
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when not found")
        void shouldThrowNotFoundException_whenNotFound_givenInvalidId() {
            UUID randomId = UUID.randomUUID();
            when(budgetRepository.findById(randomId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> financeService.getBudget(randomId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Budget");
        }
    }

    @Nested
    @DisplayName("getBudgetUtilization")
    class GetBudgetUtilizationTests {

        @Test
        @DisplayName("should calculate spent/allocated percentage")
        void shouldCalculateUtilization_whenExpensesExist_givenApprovedExpenses() {
            Expense approved1 = Expense.builder()
                    .description("Server licenses")
                    .amount(new BigDecimal("20000.00"))
                    .status(Expense.ExpenseStatus.APPROVED)
                    .budgetId(testBudget.getId())
                    .build();
            approved1.setTenantId(tenantId);
            approved1.setId(UUID.randomUUID());

            Expense paid = Expense.builder()
                    .description("Cloud hosting")
                    .amount(new BigDecimal("15000.00"))
                    .status(Expense.ExpenseStatus.PAID)
                    .budgetId(testBudget.getId())
                    .build();
            paid.setTenantId(tenantId);
            paid.setId(UUID.randomUUID());

            Expense rejected = Expense.builder()
                    .description("Rejected expense")
                    .amount(new BigDecimal("5000.00"))
                    .status(Expense.ExpenseStatus.REJECTED)
                    .budgetId(testBudget.getId())
                    .build();
            rejected.setTenantId(tenantId);
            rejected.setId(UUID.randomUUID());

            when(budgetRepository.findById(testBudget.getId())).thenReturn(Optional.of(testBudget));
            when(expenseRepository.findByBudgetIdAndDeletedAtIsNull(testBudget.getId()))
                    .thenReturn(List.of(approved1, paid, rejected));

            FinanceResponse.BudgetResponse response = financeService.getBudgetUtilization(testBudget.getId());

            assertThat(response).isNotNull();
            // Total spent = 20000 + 15000 = 35000, total budget = 100000 => 35%
            assertThat(response.getSpentAmount()).isEqualByComparingTo(new BigDecimal("35000.00"));
            assertThat(response.getUtilizationPercentage()).isEqualByComparingTo(new BigDecimal("35.00"));
        }

        @Test
        @DisplayName("should return 0% utilization when no approved expenses")
        void shouldReturnZeroUtilization_whenNoExpenses_givenEmptyBudget() {
            when(budgetRepository.findById(testBudget.getId())).thenReturn(Optional.of(testBudget));
            when(expenseRepository.findByBudgetIdAndDeletedAtIsNull(testBudget.getId()))
                    .thenReturn(List.of());

            FinanceResponse.BudgetResponse response = financeService.getBudgetUtilization(testBudget.getId());

            assertThat(response.getSpentAmount()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(response.getUtilizationPercentage()).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("createExpense")
    class CreateExpenseTests {

        @Test
        @DisplayName("should create expense")
        void shouldCreateExpense_whenValidRequest_givenAllFields() {
            FinanceRequest.ExpenseRequest request = FinanceRequest.ExpenseRequest.builder()
                    .description("Software license")
                    .amount(new BigDecimal("5000.00"))
                    .budgetId(testBudget.getId())
                    .category(Expense.ExpenseCategory.LICENSING)
                    .build();

            when(expenseRepository.save(any(Expense.class))).thenAnswer(invocation -> {
                Expense e = invocation.getArgument(0);
                e.setId(UUID.randomUUID());
                e.setCreatedAt(LocalDateTime.now());
                e.setUpdatedAt(LocalDateTime.now());
                return e;
            });

            FinanceResponse.ExpenseResponse response = financeService.createExpense(request);

            assertThat(response).isNotNull();
            assertThat(response.getDescription()).isEqualTo("Software license");
            assertThat(response.getAmount()).isEqualByComparingTo(new BigDecimal("5000.00"));
        }
    }

    @Nested
    @DisplayName("createInvoice")
    class CreateInvoiceTests {

        @Test
        @DisplayName("should create invoice")
        void shouldCreateInvoice_whenValidRequest_givenAllFields() {
            FinanceRequest.InvoiceRequest request = FinanceRequest.InvoiceRequest.builder()
                    .invoiceNumber("INV-2026-001")
                    .vendorId(UUID.randomUUID())
                    .amount(new BigDecimal("10000.00"))
                    .taxAmount(new BigDecimal("1000.00"))
                    .invoiceDate(LocalDateTime.now())
                    .dueDate(LocalDateTime.now().plusDays(30))
                    .description("Consulting services")
                    .build();

            when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> {
                Invoice i = invocation.getArgument(0);
                i.setId(UUID.randomUUID());
                i.setCreatedAt(LocalDateTime.now());
                i.setUpdatedAt(LocalDateTime.now());
                return i;
            });

            FinanceResponse.InvoiceResponse response = financeService.createInvoice(request);

            assertThat(response).isNotNull();
            assertThat(response.getInvoiceNumber()).isEqualTo("INV-2026-001");
            assertThat(response.getAmount()).isEqualByComparingTo(new BigDecimal("10000.00"));
        }
    }

    @Nested
    @DisplayName("listBudgets")
    class ListBudgetsTests {

        @Test
        @DisplayName("should return list of budgets")
        void shouldReturnBudgets_whenListing_givenExistingRecords() {
            when(budgetRepository.findByTenantIdAndDeletedAtIsNull(tenantId))
                    .thenReturn(List.of(testBudget));

            List<FinanceResponse.BudgetResponse> result = financeService.listBudgets();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("Q1 2026 Budget");
        }
    }

    @Nested
    @DisplayName("deleteBudget")
    class DeleteBudgetTests {

        @Test
        @DisplayName("should soft delete budget")
        void shouldSoftDelete_whenDeleting_givenExistingBudget() {
            when(budgetRepository.findById(testBudget.getId())).thenReturn(Optional.of(testBudget));
            when(budgetRepository.save(any(Budget.class))).thenReturn(testBudget);

            financeService.deleteBudget(testBudget.getId());

            assertThat(testBudget.isDeleted()).isTrue();
            verify(budgetRepository).save(any(Budget.class));
        }
    }
}
