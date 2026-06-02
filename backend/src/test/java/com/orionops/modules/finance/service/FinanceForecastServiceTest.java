package com.orionops.modules.finance.service;

import com.orionops.modules.finance.entity.Budget;
import com.orionops.modules.finance.entity.Expense;
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
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link FinanceForecastService}.
 * Covers budget usage forecasting and budget overspend alerts.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FinanceForecastService")
class FinanceForecastServiceTest {

    @Mock
    private FinanceRepository.BudgetRepository budgetRepository;

    @Mock
    private FinanceRepository.ExpenseRepository expenseRepository;

    @InjectMocks
    private FinanceForecastService forecastService;

    private UUID budgetId;
    private Budget budget;

    @BeforeEach
    void setUp() {
        budgetId = UUID.randomUUID();
        budget = Budget.builder()
                .name("Q1 Budget")
                .totalAmount(BigDecimal.valueOf(100000))
                .endDate(LocalDateTime.now().plusMonths(6))
                .build();
        budget.setId(budgetId);
    }

    @Nested
    @DisplayName("forecastBudgetUsage")
    class ForecastBudgetUsageTests {

        @Test
        @DisplayName("should forecast with 3-month average calculation")
        void shouldForecast_with3MonthAverage() {
            when(budgetRepository.findById(budgetId)).thenReturn(Optional.of(budget));
            when(expenseRepository.findByBudgetIdAndDeletedAtIsNull(budgetId))
                    .thenReturn(List.of(
                            buildExpense(BigDecimal.valueOf(10000), Expense.ExpenseStatus.APPROVED),
                            buildExpense(BigDecimal.valueOf(20000), Expense.ExpenseStatus.PAID)
                    ));

            Map<String, Object> result = forecastService.forecastBudgetUsage(budgetId);

            assertThat(result).containsEntry("budgetId", budgetId);
            assertThat(result.get("spentToDate")).isEqualTo(BigDecimal.valueOf(30000));
            BigDecimal avgMonthly = BigDecimal.valueOf(30000).divide(BigDecimal.valueOf(3), 2, RoundingMode.HALF_UP);
            assertThat(result.get("avgMonthlySpend")).isEqualTo(avgMonthly);
            assertThat(result).containsKey("remainingMonths");
            assertThat(result).containsKey("projectedTotalSpend");
        }

        @Test
        @DisplayName("should detect overspend when projected exceeds budget")
        void shouldDetectOverspend() {
            budget.setTotalAmount(BigDecimal.valueOf(1000));
            when(budgetRepository.findById(budgetId)).thenReturn(Optional.of(budget));
            when(expenseRepository.findByBudgetIdAndDeletedAtIsNull(budgetId))
                    .thenReturn(List.of(
                            buildExpense(BigDecimal.valueOf(50000), Expense.ExpenseStatus.APPROVED),
                            buildExpense(BigDecimal.valueOf(50000), Expense.ExpenseStatus.PAID)
                    ));

            Map<String, Object> result = forecastService.forecastBudgetUsage(budgetId);

            assertThat(result).containsEntry("onTrackToOverspend", true);
        }

        @Test
        @DisplayName("should calculate overage amount when overspending")
        void shouldCalculateOverage() {
            budget.setTotalAmount(BigDecimal.valueOf(100));
            when(budgetRepository.findById(budgetId)).thenReturn(Optional.of(budget));
            when(expenseRepository.findByBudgetIdAndDeletedAtIsNull(budgetId))
                    .thenReturn(List.of(
                            buildExpense(BigDecimal.valueOf(50000), Expense.ExpenseStatus.APPROVED)
                    ));

            Map<String, Object> result = forecastService.forecastBudgetUsage(budgetId);

            BigDecimal overage = (BigDecimal) result.get("overageAmount");
            assertThat(overage).isNotNull();
            assertThat(overage).isGreaterThan(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("should handle no expenses with zero values")
        void shouldHandleNoExpenses() {
            when(budgetRepository.findById(budgetId)).thenReturn(Optional.of(budget));
            when(expenseRepository.findByBudgetIdAndDeletedAtIsNull(budgetId))
                    .thenReturn(List.of());

            Map<String, Object> result = forecastService.forecastBudgetUsage(budgetId);

            assertThat(result).containsEntry("spentToDate", BigDecimal.ZERO);
            assertThat(result).containsEntry("avgMonthlySpend", BigDecimal.ZERO);
            assertThat(result).containsEntry("onTrackToOverspend", false);
            assertThat(result).containsEntry("overageAmount", BigDecimal.ZERO);
        }

        @Test
        @DisplayName("should only count APPROVED and PAID expenses")
        void shouldOnlyCount_approvedOrPaid() {
            when(budgetRepository.findById(budgetId)).thenReturn(Optional.of(budget));
            when(expenseRepository.findByBudgetIdAndDeletedAtIsNull(budgetId))
                    .thenReturn(List.of(
                            buildExpense(BigDecimal.valueOf(5000), Expense.ExpenseStatus.APPROVED),
                            buildExpense(BigDecimal.valueOf(5000), Expense.ExpenseStatus.PAID),
                            buildExpense(BigDecimal.valueOf(99999), Expense.ExpenseStatus.REJECTED),
                            buildExpense(BigDecimal.valueOf(99999), Expense.ExpenseStatus.PENDING)
                    ));

            Map<String, Object> result = forecastService.forecastBudgetUsage(budgetId);

            assertThat(result.get("spentToDate")).isEqualTo(BigDecimal.valueOf(10000));
        }

        @Test
        @DisplayName("should throw when budget not found")
        void shouldThrow_whenBudgetNotFound() {
            when(budgetRepository.findById(budgetId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> forecastService.forecastBudgetUsage(budgetId))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Budget not found");
        }
    }

    @Nested
    @DisplayName("getBudgetAlerts")
    class GetBudgetAlertsTests {

        @Test
        @DisplayName("should return HIGH alert when utilization at or above 80%")
        void shouldReturnHighAlert_whenOver80Percent() {
            Budget highUtilBudget = Budget.builder().name("High Budget")
                    .totalAmount(BigDecimal.valueOf(10000)).build();
            highUtilBudget.setId(budgetId);

            when(budgetRepository.findByTenantIdAndDeletedAtIsNull(any(UUID.class)))
                    .thenReturn(List.of(highUtilBudget));
            when(expenseRepository.findByBudgetIdAndDeletedAtIsNull(budgetId))
                    .thenReturn(List.of(
                            buildExpense(BigDecimal.valueOf(8500), Expense.ExpenseStatus.APPROVED)
                    ));

            List<Map<String, Object>> alerts = forecastService.getBudgetAlerts(UUID.randomUUID());

            assertThat(alerts).hasSize(1);
            assertThat(alerts.get(0)).containsEntry("alert", "HIGH");
        }

        @Test
        @DisplayName("should not return alert when utilization under 80%")
        void shouldNotReturnAlert_whenUnder80() {
            Budget lowUtilBudget = Budget.builder().name("Low Budget")
                    .totalAmount(BigDecimal.valueOf(10000)).build();
            lowUtilBudget.setId(budgetId);

            when(budgetRepository.findByTenantIdAndDeletedAtIsNull(any(UUID.class)))
                    .thenReturn(List.of(lowUtilBudget));
            when(expenseRepository.findByBudgetIdAndDeletedAtIsNull(budgetId))
                    .thenReturn(List.of(
                            buildExpense(BigDecimal.valueOf(5000), Expense.ExpenseStatus.APPROVED)
                    ));

            List<Map<String, Object>> alerts = forecastService.getBudgetAlerts(UUID.randomUUID());

            assertThat(alerts).isEmpty();
        }

        @Test
        @DisplayName("should handle zero budget amount without division error")
        void shouldHandleZeroBudget() {
            Budget zeroBudget = Budget.builder().name("Zero Budget")
                    .totalAmount(BigDecimal.ZERO).build();
            zeroBudget.setId(budgetId);

            when(budgetRepository.findByTenantIdAndDeletedAtIsNull(any(UUID.class)))
                    .thenReturn(List.of(zeroBudget));
            when(expenseRepository.findByBudgetIdAndDeletedAtIsNull(budgetId))
                    .thenReturn(List.of());

            List<Map<String, Object>> alerts = forecastService.getBudgetAlerts(UUID.randomUUID());

            assertThat(alerts).isEmpty();
        }

        @Test
        @DisplayName("should only count APPROVED and PAID expenses in alerts")
        void shouldOnlyCount_approvedAndPaid() {
            Budget b = Budget.builder().name("Mixed").totalAmount(BigDecimal.valueOf(10000)).build();
            b.setId(budgetId);

            when(budgetRepository.findByTenantIdAndDeletedAtIsNull(any(UUID.class)))
                    .thenReturn(List.of(b));
            when(expenseRepository.findByBudgetIdAndDeletedAtIsNull(budgetId))
                    .thenReturn(List.of(
                            buildExpense(BigDecimal.valueOf(8000), Expense.ExpenseStatus.APPROVED),
                            buildExpense(BigDecimal.valueOf(99999), Expense.ExpenseStatus.REJECTED)
                    ));

            List<Map<String, Object>> alerts = forecastService.getBudgetAlerts(UUID.randomUUID());

            assertThat(alerts).hasSize(1);
        }
    }

    // ================================================================
    // Helpers
    // ================================================================

    private Expense buildExpense(BigDecimal amount, Expense.ExpenseStatus status) {
        Expense expense = Expense.builder()
                .description("Test expense")
                .amount(amount)
                .budgetId(budgetId)
                .expenseDate(LocalDateTime.now())
                .status(status)
                .build();
        expense.setId(UUID.randomUUID());
        return expense;
    }
}
