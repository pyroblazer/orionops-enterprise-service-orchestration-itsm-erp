package com.orionops.modules.request.repository;

import com.orionops.modules.request.entity.ServiceRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, UUID> {

    Page<ServiceRequest> findByTenantIdAndDeletedAtIsNull(UUID tenantId, Pageable pageable);

    @Query("SELECT s FROM ServiceRequest s WHERE s.tenantId = :tenantId " +
            "AND s.deletedAt IS NULL " +
            "AND (:status IS NULL OR s.status = :status) " +
            "AND (LOWER(s.title) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<ServiceRequest> searchRequests(
            @Param("tenantId") UUID tenantId,
            @Param("status") ServiceRequest.RequestStatus status,
            @Param("search") String search,
            Pageable pageable);
}
