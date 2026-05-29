package com.orionops.modules.finance.service;

import com.orionops.common.tenant.TenantContextHolder;
import com.orionops.modules.finance.entity.Budget;
import com.orionops.modules.finance.entity.Expense;
import com.orionops.modules.finance.repository.FinanceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FinanceForecastService {

    private final FinanceRepository.BudgetRepository budgetRepository;
    private final FinanceRepository.ExpenseRepository expenseRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> forecastBudgetUsage(UUID budgetId) {
        Budget budget = budgetRepository.findById(budgetId)
            .orElseThrow(() -> new RuntimeException("Budget not found"));

        // Get expenses from last 3 months
        LocalDate threeMonthsAgo = LocalDate.now().minusMonths(3);
        List<Expense> recentExpenses = expenseRepository.findByBudgetIdAndDeletedAtIsNull(budgetId)
            .stream()
            .filter(e -> e.getExpenseDate() != null &&
                    e.getExpenseDate().toLocalDate().isAfter(threeMonthsAgo) &&
                    (e.getStatus() == Expense.ExpenseStatus.APPROVED ||
                     e.getStatus() == Expense.ExpenseStatus.PAID))
            .collect(Collectors.toList());

        BigDecimal totalSpentLast3M = recentExpenses.stream()
            .map(Expense::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calculate average monthly spend
        BigDecimal avgMonthlySpend = recentExpenses.isEmpty() ?
            BigDecimal.ZERO :
            totalSpentLast3M.divide(BigDecimal.valueOf(3), 2, java.math.RoundingMode.HALF_UP);

        // Estimate remaining months (assuming budget period is calendar year)
        LocalDate now = LocalDate.now();
        LocalDate budgetEnd = budget.getEndDate() != null ?
            budget.getEndDate().toLocalDate() :
            now.withMonth(12).withDayOfMonth(31);

        long remainingDays = java.time.temporal.ChronoUnit.DAYS.between(now, budgetEnd);
        long remainingMonths = (remainingDays + 15) / 30; // Round to months

        // Project end-of-period spend
        BigDecimal projectedAdditionalSpend = avgMonthlySpend.multiply(BigDecimal.valueOf(remainingMonths));
        BigDecimal projectedTotalSpend = totalSpentLast3M.add(projectedAdditionalSpend);

        boolean onTrackToOverspend = projectedTotalSpend.compareTo(budget.getTotalAmount()) > 0;

        return Map.of(
            "budgetId", budgetId,
            "budgetAmount", budget.getTotalAmount(),
            "spentToDate", totalSpentLast3M,
            "avgMonthlySpend", avgMonthlySpend,
            "remainingMonths", remainingMonths,
            "projectedAdditionalSpend", projectedAdditionalSpend,
            "projectedTotalSpend", projectedTotalSpend,
            "onTrackToOverspend", onTrackToOverspend,
            "overageAmount", onTrackToOverspend ?
                projectedTotalSpend.subtract(budget.getTotalAmount()) : BigDecimal.ZERO
        );
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getBudgetAlerts(UUID tenantId) {
        List<Budget> budgets = budgetRepository.findByTenantIdAndDeletedAtIsNull(tenantId);

        return budgets.stream()
            .map(budget -> {
                List<Expense> expenses = expenseRepository.findByBudgetIdAndDeletedAtIsNull(budget.getId())
                    .stream()
                    .filter(e -> e.getStatus() == Expense.ExpenseStatus.APPROVED ||
                                 e.getStatus() == Expense.ExpenseStatus.PAID)
                    .collect(Collectors.toList());

                BigDecimal totalSpent = expenses.stream()
                    .map(Expense::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal utilizationPct = budget.getTotalAmount().compareTo(BigDecimal.ZERO) > 0 ?
                    totalSpent.divide(budget.getTotalAmount(), 4, java.math.RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100)) :
                    BigDecimal.ZERO;

                return Map.<String, Object>of(
                    "budgetId", budget.getId(),
                    "budgetName", budget.getName(),
                    "budgetAmount", budget.getTotalAmount(),
                    "spent", totalSpent,
                    "utilizationPercent", utilizationPct,
                    "alert", utilizationPct.compareTo(BigDecimal.valueOf(80)) >= 0 ? "HIGH" : "NORMAL"
                );
            })
            .filter(m -> "HIGH".equals(m.get("alert")))
            .collect(Collectors.toList());
    }

    @Scheduled(cron = "0 0 1 * * *")
    @Transactional
    public void generateMonthlyForecastNotifications() {
        UUID tenantId = TenantContextHolder.getCurrentTenantId();
        List<Map<String, Object>> alerts = getBudgetAlerts(tenantId);

        for (Map<String, Object> alert : alerts) {
            log.info("Budget forecast alert: {} is at {}% utilization",
                alert.get("budgetName"),
                alert.get("utilizationPercent"));
        }
    }
}
