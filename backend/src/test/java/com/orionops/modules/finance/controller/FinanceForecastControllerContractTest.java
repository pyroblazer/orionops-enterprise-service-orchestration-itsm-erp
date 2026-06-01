package com.orionops.modules.finance.controller;

import com.orionops.modules.finance.service.FinanceForecastService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.test.context.support.WithMockUser;

import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.mockito.Mockito.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class FinanceForecastControllerContractTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FinanceForecastService forecastService;

    @Test
    @WithMockUser(roles = "VIEWER")
    void testGetBudgetForecast_ReturnsOK() throws Exception {
        UUID budgetId = UUID.randomUUID();
        Map<String, Object> forecast = Map.of(
            "budgetedAmount", 100000,
            "projectedSpend", 75000,
            "onTrack", true
        );

        when(forecastService.forecastBudgetUsage(budgetId)).thenReturn(forecast);

        mockMvc.perform(get("/api/v1/finance/forecast/budgets/{id}", budgetId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.budgetedAmount").value(100000));
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void testGetBudgetAlerts_ReturnsAlertsList() throws Exception {
        Map<String, Object> alerts = Map.of(
            "count", 2,
            "alerts", java.util.List.of()
        );

        when(forecastService.getBudgetAlerts(any(UUID.class))).thenReturn((java.util.List<Map<String, Object>>) alerts.get("alerts"));

        mockMvc.perform(get("/api/v1/finance/forecast/alerts"))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void testGetBudgetForecast_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/finance/forecast/budgets/{id}", UUID.randomUUID()))
            .andExpect(status().isUnauthorized());
    }
}
