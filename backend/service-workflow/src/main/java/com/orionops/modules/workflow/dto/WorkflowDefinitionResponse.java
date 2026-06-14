package com.orionops.modules.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowDefinitionResponse {

    private UUID id;
    private String name;
    private String description;
    private String bpmnXml;
    private String processDefinitionKey;
    private Integer version;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
