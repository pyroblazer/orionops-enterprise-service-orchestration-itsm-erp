package com.orionops.modules.inventory.controller;

import com.orionops.modules.inventory.service.InventoryTransferService;
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
class InventoryTransferControllerContractTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private InventoryTransferService transferService;

    @Test
    @WithMockUser(roles = "MANAGER")
    void testCreateTransfer_ReturnsCreated() throws Exception {
        String payload = "{\"fromWarehouse\":\"" + UUID.randomUUID() + "\",\"toWarehouse\":\"" + UUID.randomUUID() + "\",\"sku\":\"SKU-001\",\"quantity\":100}";

        mockMvc.perform(post("/api/v1/inventory/transfers")
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload))
            .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void testRecordTransitTransfer_ReturnsOK() throws Exception {
        UUID transferId = UUID.randomUUID();

        mockMvc.perform(patch("/api/v1/inventory/transfers/{id}/transit", transferId))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void testReceiveTransfer_ReturnsOK() throws Exception {
        UUID transferId = UUID.randomUUID();
        String payload = "{\"quantityReceived\":100}";

        mockMvc.perform(patch("/api/v1/inventory/transfers/{id}/receive", transferId)
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void testGetBinSuggestion_ReturnsOK() throws Exception {
        mockMvc.perform(get("/api/v1/inventory/transfers/{sku}/bin-suggestion", "SKU-001"))
            .andExpect(status().isOk());
    }
}
