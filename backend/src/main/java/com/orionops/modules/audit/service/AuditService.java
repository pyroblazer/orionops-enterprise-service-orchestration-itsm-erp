package com.orionops.modules.audit.service;

import com.orionops.modules.audit.dto.AuditResponse;
import com.orionops.modules.audit.entity.AuditEvent;
import com.orionops.modules.audit.repository.AuditEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditEventRepository auditEventRepository;

    @Transactional(readOnly = true)
    public Page<AuditResponse> getAuditLogs(String entityType, String performedBy,
                                             LocalDateTime startDate, LocalDateTime endDate,
                                             int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        UUID userId = performedBy != null ? resolveUserId(performedBy) : null;
        OffsetDateTime start = startDate != null ? startDate.atOffset(OffsetDateTime.now().getOffset()) : null;
        OffsetDateTime end = endDate != null ? endDate.atOffset(OffsetDateTime.now().getOffset()) : null;
        return auditEventRepository.searchAuditLogs(resolveTenantId(), entityType, userId,
                start, end, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<AuditResponse> getEntityAuditTrail(String entityType, UUID entityId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        return auditEventRepository.findByResourceTypeAndResourceIdAndTenantId(
                entityType, entityId, resolveTenantId(), pageable).map(this::toResponse);
    }

    private AuditResponse toResponse(AuditEvent e) {
        return AuditResponse.builder()
                .id(e.getId())
                .action(e.getAction())
                .entityType(e.getResourceType())
                .entityId(e.getResourceId())
                .performedBy(e.getUserId() != null ? e.getUserId().toString() : null)
                .oldValue(e.getOldValues())
                .newValue(e.getNewValues())
                .tenantId(e.getTenantId())
                .timestamp(e.getTimestamp() != null ? e.getTimestamp().toLocalDateTime() : null)
                .build();
    }

    private UUID resolveTenantId() {
        return UUID.fromString("00000000-0000-0000-0000-000000000001");
    }

    private UUID resolveUserId(String performedBy) {
        try {
            return UUID.fromString(performedBy);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
