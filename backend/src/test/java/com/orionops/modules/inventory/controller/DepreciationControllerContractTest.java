package com.orionops.modules.inventory.controller;

import com.orionops.modules.inventory.service.DepreciationService;
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
class DepreciationControllerContractTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DepreciationService depreciationService;

    @Test
    @WithMockUser(roles = "VIEWER")
    void testGetDepreciationSchedule_ReturnsOK() throws Exception {
        UUID assetId = UUID.randomUUID();

        mockMvc.perform(get("/api/v1/inventory/assets/{id}/depreciation", assetId))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void testGetBookValue_ReturnsOK() throws Exception {
        UUID assetId = UUID.randomUUID();

        mockMvc.perform(get("/api/v1/inventory/assets/{id}/book-value", assetId))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void testDisposeAsset_ReturnsOK() throws Exception {
        UUID assetId = UUID.randomUUID();
        String payload = "{\"disposalDate\":\"2026-05-29\",\"proceeds\":1000}";

        mockMvc.perform(post("/api/v1/inventory/assets/{id}/dispose", assetId)
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload))
            .andExpect(status().isOk());
    }
}
