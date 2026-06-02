package com.orionops.modules.finance.controller;

import com.orionops.modules.finance.service.FinanceForecastService;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.mockito.Mockito.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
@Tag("docker")
class FinanceForecastControllerContractTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("orionops_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        registry.add("spring.flyway.enabled", () -> "false");
    }

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FinanceForecastService forecastService;

    @Test
    @WithMockUser(roles = "FINANCE_VIEWER")
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
            .andExpect(jsonPath("$.budgetedAmount").value(100000));
    }

    @Test
    @WithMockUser(roles = "FINANCE_VIEWER")
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
    void testGetBudgetForecast_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/finance/forecast/budgets/{id}", UUID.randomUUID()))
            .andExpect(status().isUnauthorized());
    }
}
