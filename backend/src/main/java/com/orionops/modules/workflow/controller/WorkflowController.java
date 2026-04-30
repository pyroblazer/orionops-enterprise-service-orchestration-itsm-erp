package com.orionops.modules.workflow.controller;

import com.orionops.common.dto.ApiResponse;
import com.orionops.modules.workflow.dto.WorkflowDefinitionRequest;
import com.orionops.modules.workflow.dto.WorkflowDefinitionResponse;
import com.orionops.modules.workflow.dto.WorkflowInstanceResponse;
import com.orionops.modules.workflow.service.WorkflowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workflows")
@RequiredArgsConstructor
@Tag(name = "Workflows", description = "Workflow management with Flowable BPMN engine")
public class WorkflowController {

    private final WorkflowService workflowService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<WorkflowDefinitionResponse>> createDefinition(@Valid @RequestBody WorkflowDefinitionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(workflowService.createDefinition(request), "Workflow definition created"));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<WorkflowDefinitionResponse>>> listDefinitions() {
        return ResponseEntity.ok(ApiResponse.success(workflowService.listDefinitions()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<WorkflowDefinitionResponse>> getDefinition(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(workflowService.getDefinition(id)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update workflow definition", description = "Updates an existing workflow definition")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<WorkflowDefinitionResponse>> updateDefinition(
            @PathVariable UUID id, @Valid @RequestBody WorkflowDefinitionRequest request) {
        return ResponseEntity.ok(ApiResponse.success(workflowService.updateDefinition(id, request), "Workflow definition updated"));
    }

    @PostMapping("/{id}/start")
    @PreAuthorize("hasAnyRole('ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<WorkflowInstanceResponse>> startWorkflow(
            @PathVariable UUID id, @RequestBody(required = false) Map<String, Object> variables) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(workflowService.startWorkflow(id, variables), "Workflow started"));
    }

    @GetMapping("/instances/{id}/tasks")
    @PreAuthorize("hasAnyRole('ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<WorkflowInstanceResponse.TaskResponse>>> getTasks(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(workflowService.getTasks(id)));
    }

    @PostMapping("/tasks/{taskId}/complete")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> completeTask(
            @PathVariable String taskId, @RequestBody(required = false) Map<String, Object> variables) {
        workflowService.completeTask(taskId, variables);
        return ResponseEntity.ok(ApiResponse.success(null, "Task completed"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteDefinition(@PathVariable UUID id) {
        workflowService.deleteDefinition(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Workflow definition deleted"));
    }
}
