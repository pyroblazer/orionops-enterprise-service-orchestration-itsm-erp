package com.orionops.contract;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orionops.common.dto.ApiResponse;
import com.orionops.common.dto.PagedResponse;
import com.orionops.modules.incident.dto.CreateIncidentRequest;
import com.orionops.modules.incident.dto.IncidentResponse;
import com.orionops.modules.incident.entity.Incident;
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
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * API Contract tests for IncidentController.
 * Verifies HTTP status codes, response structure, and error responses
 * using @SpringBootTest with Testcontainers PostgreSQL.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
@Tag("docker")
@DisplayName("IncidentController Contract Tests")
class IncidentControllerContractTest {

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

    private SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor jwtProcessor() {
        return SecurityMockMvcRequestPostProcessors.jwt().jwt(j -> j
                .claim("sub", "test-user-123")
                .claim("tenant_id", tenantId.toString()))
                .authorities(new SimpleGrantedAuthority("ROLE_AGENT"));
    }

    private SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor jwtWithRole(String role) {
        return SecurityMockMvcRequestPostProcessors.jwt().jwt(j -> j
                .claim("sub", "test-user-123")
                .claim("tenant_id", tenantId.toString()))
                .authorities(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Nested
    @DisplayName("POST /api/v1/incidents")
    class CreateIncidentTests {

        @Test
        @DisplayName("should create incident and return 201")
        void shouldCreateIncident_whenValidRequest_givenAuthenticatedUser() throws Exception {
            CreateIncidentRequest request = CreateIncidentRequest.builder()
                    .title("Server is down")
                    .description("Production server unresponsive")
                    .priority(Incident.IncidentPriority.HIGH)
                    .build();

            mockMvc.perform(post("/api/v1/incidents")
                            .with(jwtWithRole("AGENT"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.data.title", is("Server is down")))
                    .andExpect(jsonPath("$.data.status", is("OPEN")))
                    .andExpect(jsonPath("$.data.priority", is("HIGH")))
                    .andExpect(jsonPath("$.data.id").exists());
        }

        @Test
        @DisplayName("should return 400 when title is blank")
        void shouldReturn400_whenTitleBlank_givenInvalidRequest() throws Exception {
            CreateIncidentRequest request = CreateIncidentRequest.builder()
                    .title("")
                    .build();

            mockMvc.perform(post("/api/v1/incidents")
                            .with(jwtWithRole("AGENT"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 401 when unauthenticated")
        void shouldReturn401_whenUnauthenticated_givenNoAuth() throws Exception {
            CreateIncidentRequest request = CreateIncidentRequest.builder()
                    .title("Test")
                    .build();

            mockMvc.perform(post("/api/v1/incidents")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/incidents")
    class ListIncidentsTests {

        @Test
        @DisplayName("should return paginated response")
        void shouldReturnPaginatedResponse_whenListing_givenIncidents() throws Exception {
            mockMvc.perform(get("/api/v1/incidents")
                            .with(jwtWithRole("AGENT"))
                            .param("page", "0")
                            .param("size", "20")
                            .param("sort", "createdAt")
                            .param("direction", "DESC"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.data.content").isArray())
                    .andExpect(jsonPath("$.data.pageNumber").exists())
                    .andExpect(jsonPath("$.data.pageSize").exists())
                    .andExpect(jsonPath("$.data.totalElements").exists());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/incidents/{id}")
    class GetIncidentTests {

        @Test
        @DisplayName("should return 404 for non-existent incident")
        void shouldReturn404_whenNotFound_givenInvalidId() throws Exception {
            UUID randomId = UUID.randomUUID();

            mockMvc.perform(get("/api/v1/incidents/{id}", randomId)
                            .with(jwtWithRole("AGENT")))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("PATCH /api/v1/incidents/{id}/resolve")
    class ResolveIncidentTests {

        @Test
        @DisplayName("should return 404 when resolving non-existent incident")
        void shouldReturn404_whenResolving_givenNonExistentId() throws Exception {
            UUID randomId = UUID.randomUUID();

            mockMvc.perform(patch("/api/v1/incidents/{id}/resolve", randomId)
                            .with(jwtWithRole("ENGINEER"))
                            .param("resolution", "Fixed")
                            .param("resolutionCode", "PERMANENT_FIX"))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/incidents/{id}")
    class DeleteIncidentTests {

        @Test
        @DisplayName("should return 404 when deleting non-existent incident")
        void shouldReturn404_whenDeleting_givenNonExistentId() throws Exception {
            UUID randomId = UUID.randomUUID();

            mockMvc.perform(delete("/api/v1/incidents/{id}", randomId)
                            .with(jwtWithRole("ADMIN")))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 403 when non-admin tries to delete")
        void shouldReturn403_whenNotAdmin_givenInsufficientRole() throws Exception {
            UUID randomId = UUID.randomUUID();

            mockMvc.perform(delete("/api/v1/incidents/{id}", randomId)
                            .with(jwtWithRole("AGENT")))
                    .andExpect(status().isForbidden());
        }
    }
}
