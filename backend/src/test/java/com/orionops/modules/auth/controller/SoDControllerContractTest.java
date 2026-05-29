package com.orionops.modules.auth.controller;

import com.orionops.modules.auth.service.SegregationOfDutiesService;
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
class SoDControllerContractTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SegregationOfDutiesService sodService;

    @Test
    @WithMockUser(roles = "VIEWER")
    void testGetSoDRules_ReturnsOK() throws Exception {
        mockMvc.perform(get("/api/v1/compliance/sod/rules"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").exists());
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void testValidateSoDCompliance_ReturnsOK() throws Exception {
        String payload = "{\"userId\":\"" + UUID.randomUUID() + "\",\"activity\":\"create_expense\"}";

        mockMvc.perform(post("/api/v1/compliance/sod/validate")
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void testCheckSoDConflict_ReturnsOK() throws Exception {
        mockMvc.perform(get("/api/v1/compliance/sod/check")
            .param("userId", UUID.randomUUID().toString())
            .param("activity", "approve_po"))
            .andExpect(status().isOk());
    }
}
