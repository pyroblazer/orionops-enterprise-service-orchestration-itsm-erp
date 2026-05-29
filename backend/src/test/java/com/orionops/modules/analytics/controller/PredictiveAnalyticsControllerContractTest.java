package com.orionops.modules.analytics.controller;

import com.orionops.modules.analytics.service.PredictiveAnalyticsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.test.context.support.WithMockUser;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class PredictiveAnalyticsControllerContractTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PredictiveAnalyticsService analyticsService;

    @Test
    @WithMockUser(roles = "VIEWER")
    void testPredictCashFlow_ReturnsOK() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/cash-flow")
            .param("months", "3"))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void testDetectAnomalies_ReturnsOK() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/anomalies"))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void testPredictVendorRisk_ReturnsOK() throws Exception {
        UUID vendorId = UUID.randomUUID();

        mockMvc.perform(get("/api/v1/analytics/vendor-risk/{vendorId}", vendorId))
            .andExpect(status().isOk());
    }
}
