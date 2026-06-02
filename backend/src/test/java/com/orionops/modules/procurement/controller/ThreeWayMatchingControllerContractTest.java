package com.orionops.modules.procurement.controller;

import com.orionops.modules.procurement.service.ThreeWayMatchingService;
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
class ThreeWayMatchingControllerContractTest {

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
    private ThreeWayMatchingService matchingService;

    @Test
    @WithMockUser(roles = "PROCUREMENT_MANAGER")
    void testRecordGoodsReceipt_ReturnsOK() throws Exception {
        String payload = "{\"poId\":\"" + UUID.randomUUID() + "\"}";

        mockMvc.perform(post("/api/v1/procurement/matching/receipts")
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "FINANCE_MANAGER")
    void testMatchInvoice_ReturnsOK() throws Exception {
        String payload = "{\"invoiceId\":\"" + UUID.randomUUID() + "\",\"poId\":\"" + UUID.randomUUID() + "\",\"receiptId\":\"" + UUID.randomUUID() + "\"}";

        mockMvc.perform(post("/api/v1/procurement/matching/match")
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "FINANCE_VIEWER")
    void testDetectVariances_ReturnsOK() throws Exception {
        UUID invoiceId = UUID.randomUUID();

        mockMvc.perform(get("/api/v1/procurement/matching/variances/{invoiceId}", invoiceId))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "FINANCE_MANAGER")
    void testFlagException_ReturnsOK() throws Exception {
        String payload = "{\"invoiceId\":\"" + UUID.randomUUID() + "\",\"reason\":\"QUANTITY_VARIANCE\"}";

        mockMvc.perform(post("/api/v1/procurement/matching/flag")
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "FINANCE_MANAGER")
    void testResolveVariance_ReturnsOK() throws Exception {
        UUID invoiceId = UUID.randomUUID();
        String payload = "{\"resolution\":\"APPROVED\"}";

        mockMvc.perform(patch("/api/v1/procurement/matching/resolve/{invoiceId}", invoiceId)
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload))
            .andExpect(status().isOk());
    }
}
