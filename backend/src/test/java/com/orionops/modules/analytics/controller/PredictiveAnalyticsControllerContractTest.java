package com.orionops.modules.analytics.controller;

import com.orionops.modules.analytics.service.PredictiveAnalyticsService;
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

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
@Tag("docker")
class PredictiveAnalyticsControllerContractTest {

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
    private PredictiveAnalyticsService analyticsService;

    @Test
    @WithMockUser(roles = "FINANCE_VIEWER")
    void testPredictCashFlow_ReturnsOK() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/cash-flow")
            .param("months", "3"))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "FINANCE_VIEWER")
    void testDetectAnomalies_ReturnsOK() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/anomalies"))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "PROCUREMENT_VIEWER")
    void testPredictVendorRisk_ReturnsOK() throws Exception {
        UUID vendorId = UUID.randomUUID();

        mockMvc.perform(get("/api/v1/analytics/vendor-risk/{vendorId}", vendorId))
            .andExpect(status().isOk());
    }
}
