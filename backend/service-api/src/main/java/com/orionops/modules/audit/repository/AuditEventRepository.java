package com.orionops.modules.audit.repository;

import com.orionops.modules.audit.entity.AuditEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.UUID;

@Repository
public interface AuditEventRepository extends JpaRepository<AuditEvent, UUID> {

    @Query("SELECT a FROM AuditEvent a WHERE a.tenantId = :tenantId " +
            "AND (:resourceType IS NULL OR a.resourceType = :resourceType) " +
            "AND (:userId IS NULL OR a.userId = :userId) " +
            "AND a.timestamp >= COALESCE(:startDate, a.timestamp) " +
            "AND a.timestamp <= COALESCE(:endDate, a.timestamp)")
    Page<AuditEvent> searchAuditLogs(
            @Param("tenantId") UUID tenantId,
            @Param("resourceType") String resourceType,
            @Param("userId") UUID userId,
            @Param("startDate") OffsetDateTime startDate,
            @Param("endDate") OffsetDateTime endDate,
            Pageable pageable);

    Page<AuditEvent> findByResourceTypeAndResourceIdAndTenantId(String resourceType, UUID resourceId, UUID tenantId, Pageable pageable);
}
