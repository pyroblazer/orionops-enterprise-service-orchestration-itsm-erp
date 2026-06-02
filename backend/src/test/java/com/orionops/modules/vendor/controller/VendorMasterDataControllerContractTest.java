package com.orionops.modules.vendor.controller;

import com.orionops.modules.vendor.service.VendorMasterDataService;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
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
class VendorMasterDataControllerContractTest {

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
    private VendorMasterDataService vendorService;

    @Test
    @WithMockUser(roles = "PROCUREMENT_MANAGER")
    void testGetDuplicates_ReturnsOK() throws Exception {
        UUID vendorId = UUID.randomUUID();

        mockMvc.perform(get("/api/v1/vendor-mdm/vendors/{id}/duplicates", vendorId))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "PROCUREMENT_MANAGER")
    void testConsolidateVendors_ReturnsOK() throws Exception {
        String payload = "{\"primaryVendorId\":\"" + UUID.randomUUID() + "\",\"duplicateVendorIds\":[\"" + UUID.randomUUID() + "\"]}";

        mockMvc.perform(post("/api/v1/vendor-mdm/vendors/consolidate")
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "PROCUREMENT_VIEWER")
    void testGetQualityScore_ReturnsOK() throws Exception {
        UUID vendorId = UUID.randomUUID();

        mockMvc.perform(get("/api/v1/vendor-mdm/vendors/{id}/quality-score", vendorId))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void testAuditVendor_ReturnsOK() throws Exception {
        UUID vendorId = UUID.randomUUID();
        String payload = "{\"fieldName\":\"name\",\"oldValue\":\"Old\",\"newValue\":\"New\",\"changedBy\":\"" + UUID.randomUUID() + "\"}";

        mockMvc.perform(post("/api/v1/vendor-mdm/vendors/{id}/audit", vendorId)
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload))
            .andExpect(status().isOk());
    }
}
