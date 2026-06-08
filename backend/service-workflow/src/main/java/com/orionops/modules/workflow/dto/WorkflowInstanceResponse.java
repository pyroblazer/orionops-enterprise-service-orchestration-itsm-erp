package com.orionops.modules.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowInstanceResponse {

    private UUID id;
    private UUID workflowDefinitionId;
    private String processInstanceId;
    private String businessKey;
    private String status;
    private UUID initiatorId;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private List<TaskResponse> tasks;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaskResponse {
        private String taskId;
        private String taskName;
        private String assignee;
        private String status;
        private Map<String, Object> variables;
    }
}
