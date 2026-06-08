package com.orionops.modules.sla.repository;

import com.orionops.modules.sla.entity.SLADefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SLADefinitionRepository extends JpaRepository<SLADefinition, UUID> {

    List<SLADefinition> findByTenantIdAndDeletedAtIsNull(UUID tenantId);

    List<SLADefinition> findByTenantIdAndActiveTrueAndDeletedAtIsNull(UUID tenantId);
}
