package com.orionops.modules.cmdb.repository;

import com.orionops.modules.cmdb.entity.ConfigurationItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ConfigurationItemRepository extends JpaRepository<ConfigurationItem, UUID> {

    List<ConfigurationItem> findByTenantIdAndDeletedAtIsNull(UUID tenantId);

    @Query("SELECT ci FROM ConfigurationItem ci WHERE ci.tenantId = :tenantId " +
            "AND ci.deletedAt IS NULL " +
            "AND (:type IS NULL OR ci.type = :type) " +
            "AND (:status IS NULL OR ci.status = :status) " +
            "AND (LOWER(ci.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<ConfigurationItem> searchCIs(
            @Param("tenantId") UUID tenantId,
            @Param("type") ConfigurationItem.CIType type,
            @Param("status") ConfigurationItem.CIStatus status,
            @Param("search") String search);
}
