package com.orionops.modules.workflow.service;

import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.modules.workflow.dto.WorkflowDefinitionRequest;
import com.orionops.modules.workflow.dto.WorkflowDefinitionResponse;
import com.orionops.modules.workflow.dto.WorkflowInstanceResponse;
import com.orionops.modules.workflow.entity.WorkflowDefinition;
import com.orionops.modules.workflow.entity.WorkflowInstance;
import com.orionops.modules.workflow.repository.WorkflowDefinitionRepository;
import com.orionops.modules.workflow.repository.WorkflowInstanceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flowable.engine.RuntimeService;
import org.flowable.engine.TaskService;
import org.flowable.engine.runtime.ProcessInstance;
import org.flowable.task.api.Task;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkflowService {

    private final WorkflowDefinitionRepository definitionRepository;
    private final WorkflowInstanceRepository instanceRepository;
    private final RuntimeService runtimeService;
    private final TaskService taskService;

    @Transactional
    public WorkflowDefinitionResponse createDefinition(WorkflowDefinitionRequest request) {
        WorkflowDefinition def = WorkflowDefinition.builder()
                .name(request.getName())
                .description(request.getDescription())
                .bpmnXml(request.getBpmnXml())
                .processDefinitionKey(request.getProcessDefinitionKey())
                .version(1)
                .build();
        def.setTenantId(resolveTenantId());
        return mapDefinitionToResponse(definitionRepository.save(def));
    }

    @Transactional(readOnly = true)
    public List<WorkflowDefinitionResponse> listDefinitions() {
        return definitionRepository.findByTenantIdAndDeletedAtIsNull(resolveTenantId())
                .stream().map(this::mapDefinitionToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WorkflowDefinitionResponse getDefinition(UUID id) {
        return mapDefinitionToResponse(findDefinitionOrThrow(id));
    }

    @Transactional
    public WorkflowDefinitionResponse updateDefinition(UUID id, WorkflowDefinitionRequest request) {
        WorkflowDefinition def = findDefinitionOrThrow(id);
        def.setName(request.getName());
        def.setDescription(request.getDescription());
        def.setBpmnXml(request.getBpmnXml());
        def.setProcessDefinitionKey(request.getProcessDefinitionKey());
        def.setVersion(def.getVersion() + 1);
        return mapDefinitionToResponse(definitionRepository.save(def));
    }

    @Transactional
    public WorkflowInstanceResponse startWorkflow(UUID definitionId, Map<String, Object> variables) {
        WorkflowDefinition def = findDefinitionOrThrow(definitionId);

        Map<String, Object> processVars = variables != null ? new HashMap<>(variables) : new HashMap<>();
        processVars.put("tenantId", resolveTenantId().toString());

        ProcessInstance processInstance = runtimeService.createProcessInstanceBuilder()
                .processDefinitionKey(def.getProcessDefinitionKey())
                .variables(processVars)
                .start();

        WorkflowInstance instance = WorkflowInstance.builder()
                .workflowDefinitionId(def.getId())
                .processInstanceId(processInstance.getId())
                .businessKey(processInstance.getBusinessKey())
                .status(WorkflowInstance.InstanceStatus.RUNNING)
                .build();
        instance.setTenantId(resolveTenantId());

        WorkflowInstance saved = instanceRepository.save(instance);
        log.info("Workflow started: definitionId={}, processInstanceId={}", definitionId, processInstance.getId());
        return mapInstanceToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<WorkflowInstanceResponse.TaskResponse> getTasks(UUID instanceId) {
        WorkflowInstance instance = findInstanceOrThrow(instanceId);
        List<Task> tasks = taskService.createTaskQuery()
                .processInstanceId(instance.getProcessInstanceId())
                .list();

        return tasks.stream().map(t -> WorkflowInstanceResponse.TaskResponse.builder()
                .taskId(t.getId())
                .taskName(t.getName())
                .assignee(t.getAssignee())
                .status("PENDING")
                .build()).collect(Collectors.toList());
    }

    @Transactional
    public void completeTask(String taskId, Map<String, Object> variables) {
        Task task = taskService.createTaskQuery().taskId(taskId).singleResult();
        if (task == null) {
            throw new ResourceNotFoundException("Task", taskId);
        }
        if (variables != null) {
            taskService.complete(taskId, variables);
        } else {
            taskService.complete(taskId);
        }
        log.info("Task completed: taskId={}", taskId);
    }

    @Transactional
    public void deleteDefinition(UUID id) {
        WorkflowDefinition def = findDefinitionOrThrow(id);
        def.softDelete();
        definitionRepository.save(def);
    }

    private WorkflowDefinition findDefinitionOrThrow(UUID id) {
        return definitionRepository.findById(id)
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("WorkflowDefinition", id));
    }

    private WorkflowInstance findInstanceOrThrow(UUID id) {
        return instanceRepository.findById(id)
                .filter(i -> !i.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("WorkflowInstance", id));
    }

    private UUID resolveTenantId() {
        return UUID.fromString("00000000-0000-0000-0000-000000000001");
    }

    private WorkflowDefinitionResponse mapDefinitionToResponse(WorkflowDefinition d) {
        return WorkflowDefinitionResponse.builder()
                .id(d.getId()).name(d.getName()).description(d.getDescription())
                .bpmnXml(d.getBpmnXml()).processDefinitionKey(d.getProcessDefinitionKey())
                .version(d.getVersion()).active(d.isActive())
                .createdAt(d.getCreatedAt()).updatedAt(d.getUpdatedAt()).build();
    }

    private WorkflowInstanceResponse mapInstanceToResponse(WorkflowInstance i) {
        return WorkflowInstanceResponse.builder()
                .id(i.getId()).workflowDefinitionId(i.getWorkflowDefinitionId())
                .processInstanceId(i.getProcessInstanceId()).businessKey(i.getBusinessKey())
                .status(i.getStatus().name()).initiatorId(i.getInitiatorId())
                .completedAt(i.getCompletedAt()).createdAt(i.getCreatedAt()).build();
    }
}
