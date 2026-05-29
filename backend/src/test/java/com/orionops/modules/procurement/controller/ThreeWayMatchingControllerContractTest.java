package com.orionops.modules.procurement.controller;

import com.orionops.modules.procurement.service.ThreeWayMatchingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.test.context.support.WithMockUser;

import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class ThreeWayMatchingControllerContractTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ThreeWayMatchingService matchingService;

    @Test
    @WithMockUser(roles = "MANAGER")
    void testRecordGoodsReceipt_ReturnsOK() throws Exception {
        String payload = "{\"poId\":\"" + UUID.randomUUID() + "\"}";

        mockMvc.perform(post("/api/v1/procurement/matching/receipts")
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void testMatchInvoice_ReturnsOK() throws Exception {
        String payload = "{\"invoiceId\":\"" + UUID.randomUUID() + "\",\"poId\":\"" + UUID.randomUUID() + "\"}";

        mockMvc.perform(post("/api/v1/procurement/matching/match")
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void testDetectVariances_ReturnsOK() throws Exception {
        UUID invoiceId = UUID.randomUUID();

        mockMvc.perform(get("/api/v1/procurement/matching/variances/{invoiceId}", invoiceId))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void testFlagException_ReturnsOK() throws Exception {
        String payload = "{\"invoiceId\":\"" + UUID.randomUUID() + "\",\"reason\":\"QUANTITY_VARIANCE\"}";

        mockMvc.perform(post("/api/v1/procurement/matching/flag")
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void testResolveVariance_ReturnsOK() throws Exception {
        UUID invoiceId = UUID.randomUUID();
        String payload = "{\"resolution\":\"APPROVED\"}";

        mockMvc.perform(patch("/api/v1/procurement/matching/resolve/{invoiceId}", invoiceId)
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload))
            .andExpect(status().isOk());
    }
}
