package com.orionops.modules.procurement.controller;

import com.orionops.modules.procurement.service.RFQService;
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

import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.any;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
@Tag("docker")
class RFQControllerContractTest {

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
    private RFQService rfqService;

    @Test
    @WithMockUser(roles = "PROCUREMENT_MANAGER")
    void testCreateRFQ_ReturnsCreated() throws Exception {
        String payload = "{\"requisitionId\":\"" + UUID.randomUUID() + "\",\"title\":\"Test RFQ\"}";
        Map<String, Object> rfq = Map.of("id", UUID.randomUUID().toString(), "status", "DRAFT");

        when(rfqService.createRFQ(any(UUID.class), any(Map.class))).thenReturn(rfq);

        mockMvc.perform(post("/api/v1/procurement/rfq")
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("DRAFT"));
    }

    @Test
    @WithMockUser(roles = "PROCUREMENT_MANAGER")
    void testSendRFQToVendors_ReturnsOK() throws Exception {
        UUID rfqId = UUID.randomUUID();
        String payload = "{\"vendorIds\":[\"" + UUID.randomUUID() + "\"]}";

        doNothing().when(rfqService).sendRFQToVendors(eq(rfqId), any());

        mockMvc.perform(post("/api/v1/procurement/rfq/{id}/send", rfqId)
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "PROCUREMENT_MANAGER")
    void testRecordBid_ReturnsOK() throws Exception {
        UUID rfqId = UUID.randomUUID();
        String payload = "{\"vendorId\":\"" + UUID.randomUUID() + "\",\"price\":5000}";

        mockMvc.perform(post("/api/v1/procurement/rfq/{id}/bids", rfqId)
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "PROCUREMENT_VIEWER")
    void testGetRFQScore_ReturnsOK() throws Exception {
        UUID rfqId = UUID.randomUUID();
        Map<String, Object> scores = Map.of("winningBid", Map.of("vendorId", UUID.randomUUID(), "score", 95));

        when(rfqService.scoreAndRankBids(rfqId)).thenReturn(scores);

        mockMvc.perform(get("/api/v1/procurement/rfq/{id}/score", rfqId))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "PROCUREMENT_MANAGER")
    void testAwardRFQ_ReturnsOK() throws Exception {
        UUID rfqId = UUID.randomUUID();
        String payload = "{\"winningVendorId\":\"" + UUID.randomUUID() + "\"}";

        mockMvc.perform(post("/api/v1/procurement/rfq/{id}/award", rfqId)
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload))
            .andExpect(status().isOk());
    }
}
