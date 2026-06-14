package com.orionops.modules.workflow.repository;

import com.orionops.modules.workflow.entity.WorkflowInstance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkflowInstanceRepository extends JpaRepository<WorkflowInstance, UUID> {

    List<WorkflowInstance> findByTenantIdAndDeletedAtIsNull(UUID tenantId);

    Optional<WorkflowInstance> findByProcessInstanceId(String processInstanceId);

    List<WorkflowInstance> findByWorkflowDefinitionIdAndDeletedAtIsNull(UUID definitionId);
}
