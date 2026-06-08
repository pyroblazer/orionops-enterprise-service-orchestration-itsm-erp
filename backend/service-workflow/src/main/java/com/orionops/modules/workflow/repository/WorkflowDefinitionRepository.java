package com.orionops.modules.workflow.repository;

import com.orionops.modules.workflow.entity.WorkflowDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkflowDefinitionRepository extends JpaRepository<WorkflowDefinition, UUID> {

    List<WorkflowDefinition> findByTenantIdAndDeletedAtIsNull(UUID tenantId);

    Optional<WorkflowDefinition> findByProcessDefinitionKeyAndTenantIdAndDeletedAtIsNull(String key, UUID tenantId);
}
