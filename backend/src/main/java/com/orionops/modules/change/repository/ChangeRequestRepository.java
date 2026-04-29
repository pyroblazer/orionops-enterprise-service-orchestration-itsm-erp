package com.orionops.modules.change.repository;

import com.orionops.modules.change.entity.ChangeRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ChangeRequestRepository extends JpaRepository<ChangeRequest, UUID> {

    Page<ChangeRequest> findByTenantIdAndDeletedAtIsNull(UUID tenantId, Pageable pageable);

    Page<ChangeRequest> findByTenantIdAndStatusAndDeletedAtIsNull(UUID tenantId, ChangeRequest.ChangeStatus status, Pageable pageable);

    @Query("SELECT c FROM ChangeRequest c WHERE c.tenantId = :tenantId " +
            "AND c.deletedAt IS NULL " +
            "AND (:status IS NULL OR c.status = :status) " +
            "AND (:changeType IS NULL OR c.changeType = :changeType) " +
            "AND (LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<ChangeRequest> searchChanges(
            @Param("tenantId") UUID tenantId,
            @Param("status") ChangeRequest.ChangeStatus status,
            @Param("changeType") ChangeRequest.ChangeType changeType,
            @Param("search") String search,
            Pageable pageable);
}
