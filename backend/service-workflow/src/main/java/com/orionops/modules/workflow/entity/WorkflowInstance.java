package com.orionops.modules.workflow.entity;

import com.orionops.common.auditing.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "workflow_instances")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowInstance extends BaseEntity {

    @Column(nullable = false)
    private UUID workflowDefinitionId;

    @Column(nullable = false)
    private String processInstanceId;

    @Column
    private String businessKey;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private InstanceStatus status = InstanceStatus.RUNNING;

    @Column
    private UUID initiatorId;

    @Column
    private LocalDateTime completedAt;

    public enum InstanceStatus {
        RUNNING, SUSPENDED, COMPLETED, TERMINATED, ERROR
    }
}
