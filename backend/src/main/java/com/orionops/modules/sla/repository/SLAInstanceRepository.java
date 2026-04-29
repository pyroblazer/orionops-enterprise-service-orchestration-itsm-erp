package com.orionops.modules.sla.repository;

import com.orionops.modules.sla.entity.SLAInstance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SLAInstanceRepository extends JpaRepository<SLAInstance, UUID> {

    Page<SLAInstance> findByTenantIdAndStatusAndDeletedAtIsNull(UUID tenantId, SLAInstance.SLAStatus status, Pageable pageable);

    Page<SLAInstance> findByTenantIdAndDeletedAtIsNull(UUID tenantId, Pageable pageable);
}
