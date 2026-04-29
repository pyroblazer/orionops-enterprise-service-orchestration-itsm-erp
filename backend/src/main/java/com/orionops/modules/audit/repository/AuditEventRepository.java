package com.orionops.modules.audit.repository;

import com.orionops.modules.audit.dto.AuditResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Repository for audit events. In a full implementation this would read from
 * an append-only audit_events table or from Kafka event store projections.
 */
@Repository
public interface AuditEventRepository extends JpaRepository<AuditResponse, UUID> {

    @Query("SELECT a FROM AuditResponse a WHERE a.tenantId = :tenantId " +
            "AND (:entityType IS NULL OR a.entityType = :entityType) " +
            "AND (:performedBy IS NULL OR a.performedBy = :performedBy) " +
            "AND (:startDate IS NULL OR a.timestamp >= :startDate) " +
            "AND (:endDate IS NULL OR a.timestamp <= :endDate)")
    Page<AuditResponse> searchAuditLogs(
            @Param("tenantId") UUID tenantId,
            @Param("entityType") String entityType,
            @Param("performedBy") String performedBy,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    Page<AuditResponse> findByEntityTypeAndEntityIdAndTenantId(String entityType, UUID entityId, UUID tenantId, Pageable pageable);
}
