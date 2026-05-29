package com.orionops.modules.vendor.controller;

import com.orionops.modules.vendor.service.VendorMasterDataService;
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
class VendorMasterDataControllerContractTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private VendorMasterDataService vendorService;

    @Test
    @WithMockUser(roles = "VIEWER")
    void testGetDuplicates_ReturnsOK() throws Exception {
        UUID vendorId = UUID.randomUUID();

        mockMvc.perform(get("/api/v1/vendors/{id}/duplicates", vendorId))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void testConsolidateVendors_ReturnsOK() throws Exception {
        String payload = "{\"primaryVendorId\":\"" + UUID.randomUUID() + "\",\"duplicateVendorIds\":[\"" + UUID.randomUUID() + "\"]}";

        mockMvc.perform(post("/api/v1/vendors/consolidate")
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void testGetQualityScore_ReturnsOK() throws Exception {
        UUID vendorId = UUID.randomUUID();

        mockMvc.perform(get("/api/v1/vendors/{id}/quality-score", vendorId))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void testAuditVendor_ReturnsOK() throws Exception {
        UUID vendorId = UUID.randomUUID();
        String payload = "{\"field\":\"value\"}";

        mockMvc.perform(post("/api/v1/vendors/{id}/audit", vendorId)
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload))
            .andExpect(status().isOk());
    }
}
