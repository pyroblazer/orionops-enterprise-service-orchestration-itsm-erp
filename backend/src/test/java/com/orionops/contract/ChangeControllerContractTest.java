package com.orionops.contract;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orionops.modules.change.dto.ChangeRequestDTO;
import com.orionops.modules.change.entity.ChangeRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

import static org.hamcrest.Matchers.is;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * API Contract tests for ChangeController.
 * Verifies CRUD endpoints and lifecycle operations (approve, reject, implement).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("test")
@Tag("docker")
@DisplayName("ChangeController Contract Tests")
class ChangeControllerContractTest {

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

    @Autowired
    private ObjectMapper objectMapper;

    private UUID tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.fromString("00000000-0000-0000-0000-000000000001");
    }

    private SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor jwtWithRole(String role) {
        return SecurityMockMvcRequestPostProcessors.jwt().jwt(j -> j
                .claim("sub", "test-user-123")
                .claim("tenant_id", tenantId.toString()))
                .authorities(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Nested
    @DisplayName("POST /api/v1/changes")
    class CreateChangeTests {

        @Test
        @DisplayName("should create change request and return 201")
        void shouldCreateChange_whenValidRequest_givenAuthenticatedEngineer() throws Exception {
            ChangeRequestDTO request = ChangeRequestDTO.builder()
                    .title("Upgrade DB to v15")
                    .description("Major version upgrade")
                    .changeType(ChangeRequest.ChangeType.NORMAL)
                    .risk(ChangeRequest.ChangeRisk.MEDIUM)
                    .rollbackPlan("Restore snapshot")
                    .build();

            mockMvc.perform(post("/api/v1/changes")
                            .with(jwtWithRole("ENGINEER"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.data.title", is("Upgrade DB to v15")))
                    .andExpect(jsonPath("$.data.status", is("DRAFT")));
        }

        @Test
        @DisplayName("should return 400 when title is blank")
        void shouldReturn400_whenTitleBlank_givenInvalidRequest() throws Exception {
            ChangeRequestDTO request = ChangeRequestDTO.builder()
                    .title("")
                    .build();

            mockMvc.perform(post("/api/v1/changes")
                            .with(jwtWithRole("ENGINEER"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 403 when agent tries to create change")
        void shouldReturn403_whenAgent_givenInsufficientRole() throws Exception {
            ChangeRequestDTO request = ChangeRequestDTO.builder()
                    .title("Test change")
                    .build();

            mockMvc.perform(post("/api/v1/changes")
                            .with(jwtWithRole("AGENT"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/changes")
    class ListChangesTests {

        @Test
        @DisplayName("should return paginated change list")
        void shouldReturnPaginated_whenListing_givenAuthenticatedUser() throws Exception {
            mockMvc.perform(get("/api/v1/changes")
                            .with(jwtWithRole("AGENT"))
                            .param("page", "0")
                            .param("size", "20"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)));
        }
    }

    @Nested
    @DisplayName("PATCH /api/v1/changes/{id}/approve")
    class ApproveChangeTests {

        @Test
        @DisplayName("should return 404 when approving non-existent change")
        void shouldReturn404_whenApproving_givenNonExistentId() throws Exception {
            mockMvc.perform(patch("/api/v1/changes/{id}/approve", UUID.randomUUID())
                            .with(jwtWithRole("MANAGER"))
                            .param("approverId", UUID.randomUUID().toString()))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("PATCH /api/v1/changes/{id}/reject")
    class RejectChangeTests {

        @Test
        @DisplayName("should return 404 when rejecting non-existent change")
        void shouldReturn404_whenRejecting_givenNonExistentId() throws Exception {
            mockMvc.perform(patch("/api/v1/changes/{id}/reject", UUID.randomUUID())
                            .with(jwtWithRole("MANAGER"))
                            .param("reason", "Insufficient testing"))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("PATCH /api/v1/changes/{id}/implement")
    class ImplementChangeTests {

        @Test
        @DisplayName("should return 404 when implementing non-existent change")
        void shouldReturn404_whenImplementing_givenNonExistentId() throws Exception {
            mockMvc.perform(patch("/api/v1/changes/{id}/implement", UUID.randomUUID())
                            .with(jwtWithRole("ENGINEER"))
                            .param("notes", "Implementation started"))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/changes/{id}")
    class DeleteChangeTests {

        @Test
        @DisplayName("should return 404 for non-existent change")
        void shouldReturn404_whenDeleting_givenNonExistentId() throws Exception {
            mockMvc.perform(delete("/api/v1/changes/{id}", UUID.randomUUID())
                            .with(jwtWithRole("ADMIN")))
                    .andExpect(status().isNotFound());
        }
    }
}
