package com.orionops.modules.inventory.controller;

import com.orionops.modules.inventory.service.DepreciationService;
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
class DepreciationControllerContractTest {

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
    private DepreciationService depreciationService;

    @Test
    @WithMockUser(roles = "FINANCE_VIEWER")
    void testGetDepreciationSchedule_ReturnsOK() throws Exception {
        UUID assetId = UUID.randomUUID();

        mockMvc.perform(get("/api/v1/inventory/assets/{id}/depreciation", assetId))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "FINANCE_VIEWER")
    void testGetBookValue_ReturnsOK() throws Exception {
        UUID assetId = UUID.randomUUID();

        mockMvc.perform(get("/api/v1/inventory/assets/{id}/book-value", assetId))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "FINANCE_MANAGER")
    void testDisposeAsset_ReturnsOK() throws Exception {
        UUID assetId = UUID.randomUUID();
        String payload = "{\"disposalDate\":\"2026-05-29\",\"proceeds\":1000}";

        mockMvc.perform(post("/api/v1/inventory/assets/{id}/dispose", assetId)
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload))
            .andExpect(status().isOk());
    }
}
