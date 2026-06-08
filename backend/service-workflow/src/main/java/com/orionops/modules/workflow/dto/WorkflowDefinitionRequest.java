package com.orionops.modules.workflow.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowDefinitionRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private String description;
    private String bpmnXml;
    private String processDefinitionKey;
}
