package com.orionops.modules.incident.repository;

import com.orionops.modules.incident.entity.Incident;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Repository for Incident entity with custom query methods
 * for filtering, counting, and searching incidents.
 */
@Repository
public interface IncidentRepository extends JpaRepository<Incident, UUID> {

    Page<Incident> findByTenantIdAndDeletedAtIsNull(UUID tenantId, Pageable pageable);

    Page<Incident> findByTenantIdAndStatusAndDeletedAtIsNull(UUID tenantId, Incident.IncidentStatus status, Pageable pageable);

    Page<Incident> findByTenantIdAndAssigneeIdAndDeletedAtIsNull(UUID tenantId, UUID assigneeId, Pageable pageable);

    Page<Incident> findByTenantIdAndServiceIdAndDeletedAtIsNull(UUID tenantId, UUID serviceId, Pageable pageable);

    long countByTenantIdAndStatusAndDeletedAtIsNull(UUID tenantId, Incident.IncidentStatus status);

    @Query("SELECT i FROM Incident i WHERE i.tenantId = :tenantId " +
            "AND i.deletedAt IS NULL " +
            "AND (:status IS NULL OR i.status = :status) " +
            "AND (:priority IS NULL OR i.priority = :priority) " +
            "AND (:assigneeId IS NULL OR i.assigneeId = :assigneeId) " +
            "AND (:serviceId IS NULL OR i.serviceId = :serviceId) " +
            "AND (:category IS NULL OR i.category = :category) " +
            "AND (LOWER(i.title) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "     OR LOWER(i.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Incident> searchIncidents(
            @Param("tenantId") UUID tenantId,
            @Param("status") Incident.IncidentStatus status,
            @Param("priority") Incident.IncidentPriority priority,
            @Param("assigneeId") UUID assigneeId,
            @Param("serviceId") UUID serviceId,
            @Param("category") String category,
            @Param("search") String search,
            Pageable pageable);
}
