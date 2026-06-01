package com.orionops.integration;

import com.orionops.OrionOpsApplication;
import com.orionops.common.tenant.TenantResolutionFilter;
import com.orionops.config.CachingConfig;
import com.orionops.config.KafkaConfig;
import com.orionops.config.MinioConfig;
import com.orionops.config.OpenApiConfig;
import com.orionops.config.OpenSearchConfig;
import com.orionops.config.RedisConfig;
import com.orionops.config.RestClientConfig;
import com.orionops.config.SecurityConfig;
import com.orionops.modules.audit.entity.AuditEvent;
import com.orionops.modules.audit.repository.AuditEventRepository;
import com.orionops.modules.integration.connector.ConnectorConfig;
import com.orionops.modules.integration.email.EmailConfig;
import com.orionops.modules.integration.entra.EntraIdConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration;
import org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration;
import org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.OffsetDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(excludeAutoConfiguration = {
    SecurityAutoConfiguration.class,
    SecurityFilterAutoConfiguration.class,
    RedisAutoConfiguration.class,
    RedisRepositoriesAutoConfiguration.class,
    KafkaAutoConfiguration.class
})
@ComponentScan(
    basePackageClasses = OrionOpsApplication.class,
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.ASSIGNABLE_TYPE,
        classes = {
            SecurityConfig.class, RedisConfig.class, OpenSearchConfig.class,
            MinioConfig.class, KafkaConfig.class, OpenApiConfig.class,
            RestClientConfig.class, CachingConfig.class,
            TenantResolutionFilter.class,
            ConnectorConfig.class, EntraIdConfig.class, EmailConfig.class
        }
    )
)
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
@Tag("docker")
@DisplayName("AuditEventRepository IT")
class AuditEventRepositoryIT {

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
    private AuditEventRepository auditEventRepository;

    @Nested
    @DisplayName("query by entity type")
    class QueryByEntityTypeTests {

        @Test
        @DisplayName("should query audit events by resource type and resource ID")
        void shouldQueryByEntityType_whenSearching_givenEntityType() {
            Page<AuditEvent> result = auditEventRepository.findByResourceTypeAndResourceIdAndTenantId(
                    "incident", UUID.randomUUID(),
                    UUID.fromString("00000000-0000-0000-0000-000000000001"),
                    PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "timestamp")));

            assertThat(result).isNotNull();
            assertThat(result.getContent()).isNotNull();
        }
    }

    @Nested
    @DisplayName("query by date range")
    class QueryByDateRangeTests {

        @Test
        @DisplayName("should query audit events with date range filters")
        void shouldQueryWithDateRange_whenSearching_givenDateRange() {
            OffsetDateTime start = OffsetDateTime.now().minusDays(30);
            OffsetDateTime end = OffsetDateTime.now();

            Page<AuditEvent> result = auditEventRepository.searchAuditLogs(
                    UUID.fromString("00000000-0000-0000-0000-000000000001"),
                    null, null, start, end,
                    PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "timestamp")));

            assertThat(result).isNotNull();
            assertThat(result.getContent()).isNotNull();
        }
    }

    @Nested
    @DisplayName("query by user")
    class QueryByUserTests {

        @Test
        @DisplayName("should query audit events by userId")
        void shouldQueryByUser_whenSearching_givenUsername() {
            Page<AuditEvent> result = auditEventRepository.searchAuditLogs(
                    UUID.fromString("00000000-0000-0000-0000-000000000001"),
                    null, UUID.randomUUID(), null, null,
                    PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "timestamp")));

            assertThat(result).isNotNull();
        }
    }
}
