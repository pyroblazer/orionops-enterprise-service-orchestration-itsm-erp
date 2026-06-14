package com.orionops.modules.cmdb.repository;

import com.orionops.modules.cmdb.entity.Service;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ServiceRepository extends JpaRepository<Service, UUID> {

    List<Service> findByTenantIdAndDeletedAtIsNull(UUID tenantId);

    List<Service> findByTenantIdAndStatusAndDeletedAtIsNull(UUID tenantId, Service.ServiceStatus status);
}
