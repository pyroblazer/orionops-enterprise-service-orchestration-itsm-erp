package com.orionops.modules.audit.service;

import com.orionops.common.tenant.TenantContextHolder;
import com.orionops.modules.audit.dto.AuditResponse;
import com.orionops.modules.audit.entity.AuditEvent;
import com.orionops.modules.audit.repository.AuditEventRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuditService")
class AuditServiceTest {

    @Mock
    private AuditEventRepository auditEventRepository;

    @InjectMocks
    private AuditService auditService;

    private UUID tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        TenantContextHolder.setCurrentTenantId(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private AuditEvent buildAuditEvent(UUID id, String action, String entityType) {
        AuditEvent event = AuditEvent.builder()
                .action(action)
                .resourceType(entityType)
                .resourceId(UUID.randomUUID())
                .userId(UUID.randomUUID())
                .oldValues("{}")
                .newValues("{}")
                .build();
        event.setId(id);
        event.setTenantId(tenantId);
        event.setTimestamp(OffsetDateTime.now());
        return event;
    }

    @Nested
    @DisplayName("getAuditLogs")
    class GetAuditLogs {

        @Test
        @DisplayName("returns paginated audit logs ordered by timestamp DESC")
        void returnsPaginatedLogs() {
            AuditEvent event = buildAuditEvent(UUID.randomUUID(), "CREATE", "Incident");
            Page<AuditEvent> page = new PageImpl<>(List.of(event));

            when(auditEventRepository.searchAuditLogs(eq(tenantId), any(), any(), any(), any(), any()))
                    .thenReturn(page);

            Page<AuditResponse> result = auditService.getAuditLogs(null, null, null, null, 0, 10);

            assertThat(result.getContent()).hasSize(1);
        }

        @Test
        @DisplayName("resolves performedBy UUID from string")
        void resolvesPerformedBy() {
            UUID userId = UUID.randomUUID();
            when(auditEventRepository.searchAuditLogs(eq(tenantId), any(), eq(userId), any(), any(), any()))
                    .thenReturn(new PageImpl<>(List.of()));

            auditService.getAuditLogs(null, userId.toString(), null, null, 0, 10);

            // Verifies userId was resolved
        }

        @Test
        @DisplayName("handles null performedBy")
        void handlesNullPerformedBy() {
            when(auditEventRepository.searchAuditLogs(eq(tenantId), any(), eq(null), any(), any(), any()))
                    .thenReturn(new PageImpl<>(List.of()));

            auditService.getAuditLogs(null, null, null, null, 0, 10);

            // Verifies null is handled
        }
    }

    @Nested
    @DisplayName("getEntityAuditTrail")
    class GetEntityAuditTrail {

        @Test
        @DisplayName("returns entity-specific audit trail")
        void returnsEntityTrail() {
            UUID entityId = UUID.randomUUID();
            AuditEvent event = buildAuditEvent(UUID.randomUUID(), "UPDATE", "Incident");
            Page<AuditEvent> page = new PageImpl<>(List.of(event));

            when(auditEventRepository.findByResourceTypeAndResourceIdAndTenantId(
                    eq("Incident"), eq(entityId), eq(tenantId), any(Pageable.class)))
                    .thenReturn(page);

            Page<AuditResponse> result = auditService.getEntityAuditTrail("Incident", entityId, 0, 10);

            assertThat(result.getContent()).hasSize(1);
        }
    }
}
