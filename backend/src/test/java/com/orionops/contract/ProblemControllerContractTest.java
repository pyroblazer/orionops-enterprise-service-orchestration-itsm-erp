package com.orionops.contract;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orionops.modules.problem.dto.ProblemRequest;
import com.orionops.modules.problem.entity.Problem;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * API Contract tests for ProblemController.
 * Verifies CRUD endpoints and lifecycle operations.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("test")
@Tag("docker")
@DisplayName("ProblemController Contract Tests")
class ProblemControllerContractTest {

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
    @DisplayName("POST /api/v1/problems")
    class CreateProblemTests {

        @Test
        @DisplayName("should create problem and return 201")
        void shouldCreateProblem_whenValidRequest_givenAuthenticatedUser() throws Exception {
            ProblemRequest request = ProblemRequest.builder()
                    .title("Recurring DB timeouts")
                    .description("Database connection timeouts every 2 hours")
                    .priority(Problem.ProblemPriority.HIGH)
                    .category("Database")
                    .workaround("Restart connection pool")
                    .build();

            mockMvc.perform(post("/api/v1/problems")
                            .with(jwtWithRole("AGENT"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.data.title", is("Recurring DB timeouts")))
                    .andExpect(jsonPath("$.data.status", is("OPEN")))
                    .andExpect(jsonPath("$.data.priority", is("HIGH")));
        }

        @Test
        @DisplayName("should return 400 when title is blank")
        void shouldReturn400_whenTitleBlank_givenInvalidRequest() throws Exception {
            ProblemRequest request = ProblemRequest.builder()
                    .title("")
                    .build();

            mockMvc.perform(post("/api/v1/problems")
                            .with(jwtWithRole("AGENT"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/problems")
    class ListProblemsTests {

        @Test
        @DisplayName("should return paginated problem list")
        void shouldReturnPaginated_whenListing_givenAuthenticatedUser() throws Exception {
            mockMvc.perform(get("/api/v1/problems")
                            .with(jwtWithRole("AGENT"))
                            .param("page", "0")
                            .param("size", "20"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/problems/{id}")
    class GetProblemTests {

        @Test
        @DisplayName("should return 404 for non-existent problem")
        void shouldReturn404_whenNotFound_givenInvalidId() throws Exception {
            UUID randomId = UUID.randomUUID();
            mockMvc.perform(get("/api/v1/problems/{id}", randomId)
                            .with(jwtWithRole("AGENT")))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("PUT /api/v1/problems/{id}")
    class UpdateProblemTests {

        @Test
        @DisplayName("should return 404 when updating non-existent problem")
        void shouldReturn404_whenUpdating_givenNonExistentId() throws Exception {
            ProblemRequest request = ProblemRequest.builder()
                    .title("Updated title")
                    .build();

            mockMvc.perform(put("/api/v1/problems/{id}", UUID.randomUUID())
                            .with(jwtWithRole("ENGINEER"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/problems/{id}")
    class DeleteProblemTests {

        @Test
        @DisplayName("should return 404 for non-existent problem")
        void shouldReturn404_whenDeleting_givenNonExistentId() throws Exception {
            mockMvc.perform(delete("/api/v1/problems/{id}", UUID.randomUUID())
                            .with(jwtWithRole("ADMIN")))
                    .andExpect(status().isNotFound());
        }
    }
}
