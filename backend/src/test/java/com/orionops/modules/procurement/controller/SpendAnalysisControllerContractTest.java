package com.orionops.modules.procurement.controller;

import com.orionops.modules.procurement.service.SpendAnalysisService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.test.context.support.WithMockUser;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class SpendAnalysisControllerContractTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SpendAnalysisService spendService;

    @Test
    @WithMockUser(roles = "VIEWER")
    void testGetSpendByVendor_ReturnsOK() throws Exception {
        mockMvc.perform(get("/api/v1/procurement/spend/by-vendor"))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void testGetSpendByCategory_ReturnsOK() throws Exception {
        mockMvc.perform(get("/api/v1/procurement/spend/by-category"))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void testGetConsolidationOpportunities_ReturnsOK() throws Exception {
        mockMvc.perform(get("/api/v1/procurement/spend/consolidation"))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void testGetVendorConcentration_ReturnsOK() throws Exception {
        mockMvc.perform(get("/api/v1/procurement/spend/concentration"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").exists());
    }
}
