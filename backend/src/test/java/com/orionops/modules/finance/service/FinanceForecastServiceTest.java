package com.orionops.modules.finance.service;

import com.orionops.modules.finance.entity.Budget;
import com.orionops.modules.finance.repository.FinanceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FinanceForecastServiceTest {

    @InjectMocks
    private FinanceForecastService forecastService;

    @Mock
    private FinanceRepository.BudgetRepository budgetRepository;

    @Mock
    private FinanceRepository.ExpenseRepository expenseRepository;

    @Test
    void testForecastBudgetUsage() {
        UUID budgetId = UUID.randomUUID();
        Budget budget = Budget.builder()
                .name("Test Budget")
                .totalAmount(BigDecimal.valueOf(100000))
                .endDate(LocalDateTime.now().plusMonths(6))
                .build();
        budget.setId(budgetId);

        when(budgetRepository.findById(budgetId)).thenReturn(Optional.of(budget));
        when(expenseRepository.findByBudgetIdAndDeletedAtIsNull(budgetId)).thenReturn(List.of());

        Map<String, Object> forecast = forecastService.forecastBudgetUsage(budgetId);
        assertNotNull(forecast);
        assertTrue(forecast.containsKey("projectedTotalSpend"));
        assertTrue(forecast.containsKey("overageAmount"));
    }

    @Test
    void testGetBudgetAlerts() {
        UUID tenantId = UUID.randomUUID();
        when(budgetRepository.findByTenantIdAndDeletedAtIsNull(tenantId)).thenReturn(List.of());

        List<Map<String, Object>> alerts = forecastService.getBudgetAlerts(tenantId);
        assertNotNull(alerts);
        assertIsInstance(alerts, List.class);
    }

    private void assertIsInstance(Object obj, Class<?> clazz) {
        assertTrue(clazz.isInstance(obj));
    }
}
