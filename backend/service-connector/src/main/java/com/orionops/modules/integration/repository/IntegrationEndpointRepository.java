package com.orionops.modules.integration.repository;

import com.orionops.modules.integration.entity.IntegrationEndpoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IntegrationEndpointRepository extends JpaRepository<IntegrationEndpoint, UUID> {

    List<IntegrationEndpoint> findByTenantIdAndDeletedAtIsNull(UUID tenantId);

    List<IntegrationEndpoint> findByTenantIdAndStatusAndDeletedAtIsNull(UUID tenantId, IntegrationEndpoint.IntegrationStatus status);
}
