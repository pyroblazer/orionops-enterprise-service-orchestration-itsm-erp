package com.orionops.modules.finance.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class FinanceForecastServiceTest {

    @Mock
    private FinanceForecastService forecastService;

    @Test
    void testForecastBudgetUsage() {
        UUID budgetId = UUID.randomUUID();
        Map<String, Object> forecast = forecastService.forecastBudgetUsage(budgetId);
        assertNotNull(forecast);
        assertTrue(forecast.containsKey("projected"));
        assertTrue(forecast.containsKey("overage"));
    }

    @Test
    void testGetBudgetAlerts() {
        UUID tenantId = UUID.randomUUID();
        List<Map<String, Object>> alerts = forecastService.getBudgetAlerts(tenantId);
        assertNotNull(alerts);
        assertIsInstance(alerts, List.class);
    }

    private void assertIsInstance(Object obj, Class<?> clazz) {
        assertTrue(clazz.isInstance(obj));
    }
}
