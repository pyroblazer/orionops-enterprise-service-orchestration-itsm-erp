package com.orionops.integration;

import com.orionops.modules.incident.entity.Incident;
import com.orionops.modules.incident.repository.IncidentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for {@link IncidentRepository} using Testcontainers PostgreSQL.
 * Verifies JPA queries, pagination, and soft-delete filtering against a real database.
 */
@DataJpaTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
@Tag("docker")
@DisplayName("IncidentRepository IT")
class IncidentRepositoryIT {

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
    private TestEntityManager entityManager;

    @Autowired
    private IncidentRepository incidentRepository;

    private UUID tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.fromString("00000000-0000-0000-0000-000000000001");
    }

    private Incident createAndPersistIncident(String title, Incident.IncidentStatus status,
                                               Incident.IncidentPriority priority, UUID assigneeId) {
        Incident incident = Incident.builder()
                .title(title)
                .description("Test incident")
                .status(status)
                .priority(priority)
                .assigneeId(assigneeId)
                .escalationLevel(0)
                .build();
        incident.setTenantId(tenantId);
        incident.setCreatedBy("test-user");
        incident.setUpdatedBy("test-user");
        entityManager.persistAndFlush(incident);
        return incident;
    }

    @Nested
    @DisplayName("save and findById")
    class SaveAndFindTests {

        @Test
        @DisplayName("should persist and retrieve incident by ID")
        void shouldPersistAndRetrieve_whenSaving_givenValidIncident() {
            Incident incident = createAndPersistIncident(
                    "DB Connection Timeout", Incident.IncidentStatus.OPEN,
                    Incident.IncidentPriority.HIGH, null);

            Incident found = incidentRepository.findById(incident.getId()).orElse(null);

            assertThat(found).isNotNull();
            assertThat(found.getTitle()).isEqualTo("DB Connection Timeout");
            assertThat(found.getStatus()).isEqualTo(Incident.IncidentStatus.OPEN);
            assertThat(found.getPriority()).isEqualTo(Incident.IncidentPriority.HIGH);
            assertThat(found.getTenantId()).isEqualTo(tenantId);
            assertThat(found.getCreatedAt()).isNotNull();
            assertThat(found.getUpdatedAt()).isNotNull();
        }
    }

    @Nested
    @DisplayName("searchIncidents")
    class SearchIncidentsTests {

        @Test
        @DisplayName("should filter by status")
        void shouldFilterByStatus_whenSearching_givenStatusFilter() {
            createAndPersistIncident("Open incident", Incident.IncidentStatus.OPEN,
                    Incident.IncidentPriority.MEDIUM, null);
            createAndPersistIncident("Resolved incident", Incident.IncidentStatus.RESOLVED,
                    Incident.IncidentPriority.MEDIUM, null);

            Page<Incident> result = incidentRepository.searchIncidents(
                    tenantId, Incident.IncidentStatus.OPEN, null, null, null, null,
                    "", PageRequest.of(0, 20));

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getStatus()).isEqualTo(Incident.IncidentStatus.OPEN);
        }

        @Test
        @DisplayName("should filter by priority")
        void shouldFilterByPriority_whenSearching_givenPriorityFilter() {
            createAndPersistIncident("Critical issue", Incident.IncidentStatus.OPEN,
                    Incident.IncidentPriority.CRITICAL, null);
            createAndPersistIncident("Low issue", Incident.IncidentStatus.OPEN,
                    Incident.IncidentPriority.LOW, null);

            Page<Incident> result = incidentRepository.searchIncidents(
                    tenantId, null, Incident.IncidentPriority.CRITICAL, null, null, null,
                    "", PageRequest.of(0, 20));

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getPriority()).isEqualTo(Incident.IncidentPriority.CRITICAL);
        }

        @Test
        @DisplayName("should filter by assignee")
        void shouldFilterByAssignee_whenSearching_givenAssigneeFilter() {
            UUID assignee1 = UUID.randomUUID();
            UUID assignee2 = UUID.randomUUID();

            createAndPersistIncident("Assigned to 1", Incident.IncidentStatus.OPEN,
                    Incident.IncidentPriority.MEDIUM, assignee1);
            createAndPersistIncident("Assigned to 2", Incident.IncidentStatus.OPEN,
                    Incident.IncidentPriority.MEDIUM, assignee2);

            Page<Incident> result = incidentRepository.searchIncidents(
                    tenantId, null, null, assignee1, null, null,
                    "", PageRequest.of(0, 20));

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getAssigneeId()).isEqualTo(assignee1);
        }

        @Test
        @DisplayName("should search by title text")
        void shouldSearchByTitle_whenSearching_givenSearchTerm() {
            createAndPersistIncident("Network outage in DC-East",
                    Incident.IncidentStatus.OPEN, Incident.IncidentPriority.HIGH, null);
            createAndPersistIncident("Disk space warning on prod-app-01",
                    Incident.IncidentStatus.OPEN, Incident.IncidentPriority.MEDIUM, null);

            Page<Incident> result = incidentRepository.searchIncidents(
                    tenantId, null, null, null, null, null,
                    "Network outage", PageRequest.of(0, 20));

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getTitle()).containsIgnoringCase("network outage");
        }
    }

    @Nested
    @DisplayName("pagination")
    class PaginationTests {

        @Test
        @DisplayName("should paginate results correctly")
        void shouldPaginate_whenRequesting_givenMultipleIncidents() {
            for (int i = 0; i < 15; i++) {
                createAndPersistIncident("Incident " + i, Incident.IncidentStatus.OPEN,
                        Incident.IncidentPriority.MEDIUM, null);
            }

            Page<Incident> page1 = incidentRepository.searchIncidents(
                    tenantId, null, null, null, null, null,
                    "", PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt")));

            assertThat(page1.getContent()).hasSize(10);
            assertThat(page1.getTotalElements()).isEqualTo(15);
            assertThat(page1.getTotalPages()).isEqualTo(2);
            assertThat(page1.isFirst()).isTrue();
            assertThat(page1.isLast()).isFalse();

            Page<Incident> page2 = incidentRepository.searchIncidents(
                    tenantId, null, null, null, null, null,
                    "", PageRequest.of(1, 10, Sort.by(Sort.Direction.DESC, "createdAt")));

            assertThat(page2.getContent()).hasSize(5);
            assertThat(page2.isLast()).isTrue();
        }
    }

    @Nested
    @DisplayName("soft delete filter")
    class SoftDeleteFilterTests {

        @Test
        @DisplayName("should exclude soft-deleted incidents from search")
        void shouldExcludeDeleted_whenSearching_givenSoftDeletedIncidents() {
            Incident active = createAndPersistIncident("Active incident",
                    Incident.IncidentStatus.OPEN, Incident.IncidentPriority.MEDIUM, null);

            Incident toDelete = createAndPersistIncident("Deleted incident",
                    Incident.IncidentStatus.OPEN, Incident.IncidentPriority.MEDIUM, null);
            toDelete.softDelete();
            entityManager.persistAndFlush(toDelete);

            Page<Incident> result = incidentRepository.searchIncidents(
                    tenantId, null, null, null, null, null,
                    "", PageRequest.of(0, 20));

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getTitle()).isEqualTo("Active incident");
        }

        @Test
        @DisplayName("should find soft-deleted incident by ID but mark as deleted")
        void shouldFindDeletedById_whenSoftDeleted_givenId() {
            Incident incident = createAndPersistIncident("To delete",
                    Incident.IncidentStatus.OPEN, Incident.IncidentPriority.MEDIUM, null);
            incident.softDelete();
            entityManager.persistAndFlush(incident);

            Incident found = incidentRepository.findById(incident.getId()).orElse(null);
            assertThat(found).isNotNull();
            assertThat(found.isDeleted()).isTrue();
        }
    }
}
