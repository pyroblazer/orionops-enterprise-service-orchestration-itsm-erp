package com.orionops.modules.auth.controller;

import com.orionops.modules.auth.service.ApprovalAuthorityService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.test.context.support.WithMockUser;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class ApprovalAuthorityControllerContractTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ApprovalAuthorityService authorityService;

    @Test
    @WithMockUser(roles = "ADMIN")
    void testSetApprovalAuthority_ReturnsOK() throws Exception {
        String payload = "{\"userId\":\"" + UUID.randomUUID() + "\",\"activityType\":\"APPROVE_EXPENSE\",\"maxAmount\":10000}";

        mockMvc.perform(post("/api/v1/compliance/approval-authorities")
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void testCanUserApprove_ReturnsOK() throws Exception {
        String payload = "{\"userId\":\"" + UUID.randomUUID() + "\",\"activityType\":\"APPROVE_PO\",\"amount\":5000}";

        mockMvc.perform(post("/api/v1/compliance/approval-authorities/can-approve")
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void testGetSuggestedApprover_ReturnsOK() throws Exception {
        mockMvc.perform(get("/api/v1/compliance/approval-authorities/suggest")
            .param("activityType", "APPROVE_INVOICE")
            .param("amount", "20000"))
            .andExpect(status().isOk());
    }
}
