package com.orionops.modules.audit.service;

import com.orionops.modules.audit.dto.AuditResponse;
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
        return auditEventRepository.searchAuditLogs(resolveTenantId(), entityType, performedBy,
                startDate, endDate, pageable);
    }

    @Transactional(readOnly = true)
    public Page<AuditResponse> getEntityAuditTrail(String entityType, UUID entityId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        return auditEventRepository.findByEntityTypeAndEntityIdAndTenantId(entityType, entityId, resolveTenantId(), pageable);
    }

    private UUID resolveTenantId() {
        return UUID.fromString("00000000-0000-0000-0000-000000000001");
    }
}
