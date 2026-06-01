package com.orionops.modules.finance.controller;

import com.orionops.modules.finance.service.GeneralLedgerService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.test.context.support.WithMockUser;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.mockito.Mockito.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class GeneralLedgerControllerContractTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private GeneralLedgerService glService;

    @Test
    @WithMockUser(roles = "VIEWER")
    void testGetChartOfAccounts_ReturnsOK() throws Exception {
        Map<String, Object> coa = Map.of(
            "ASSET", java.util.List.of(Map.of("code", "1000", "name", "Cash")),
            "LIABILITY", java.util.List.of()
        );

        when(glService.getChartOfAccounts(any(UUID.class))).thenReturn(java.util.List.of(coa));

        mockMvc.perform(get("/api/v1/finance/gl/accounts"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").exists());
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void testGetTrialBalance_ReturnsOK() throws Exception {
        Map<String, Object> tb = Map.of(
            "debits", 500000,
            "credits", 500000,
            "balanced", true
        );

        when(glService.getTrialBalance(any(UUID.class), any(LocalDate.class))).thenReturn(tb);

        mockMvc.perform(get("/api/v1/finance/gl/trial-balance"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.balanced").value(true));
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void testGetIncomeStatement_ReturnsOK() throws Exception {
        Map<String, Object> is = Map.of(
            "revenue", 1000000,
            "expenses", 600000,
            "netIncome", 400000
        );

        when(glService.generateIncomeStatement(any(UUID.class), any(LocalDate.class), any(LocalDate.class))).thenReturn(is);

        mockMvc.perform(get("/api/v1/finance/gl/income-statement"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.netIncome").value(400000));
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void testPostGLEntry_ReturnsCreated() throws Exception {
        String payload = "{\"accountCode\":\"1000\",\"amount\":1000,\"reference\":\"TEST\"}";

        mockMvc.perform(post("/api/v1/finance/gl/post")
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload))
            .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void testGetAccountBalance_ReturnsOK() throws Exception {
        when(glService.getAccountBalance(eq("1000"), any(LocalDate.class))).thenReturn(java.math.BigDecimal.valueOf(50000));

        mockMvc.perform(get("/api/v1/finance/gl/accounts/{code}/balance", "1000"))
            .andExpect(status().isOk());
    }
}
