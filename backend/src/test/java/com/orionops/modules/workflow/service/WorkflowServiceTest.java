package com.orionops.modules.workflow.service;

import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.modules.workflow.dto.WorkflowDefinitionRequest;
import com.orionops.modules.workflow.dto.WorkflowDefinitionResponse;
import com.orionops.modules.workflow.dto.WorkflowInstanceResponse;
import com.orionops.modules.workflow.entity.WorkflowDefinition;
import com.orionops.modules.workflow.entity.WorkflowInstance;
import com.orionops.modules.workflow.repository.WorkflowDefinitionRepository;
import com.orionops.modules.workflow.repository.WorkflowInstanceRepository;
import org.flowable.engine.RuntimeService;
import org.flowable.engine.TaskService;
import org.flowable.engine.runtime.ProcessInstance;
import org.flowable.engine.runtime.ProcessInstanceBuilder;
import org.flowable.task.api.Task;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link WorkflowService}.
 * Covers workflow start, task completion, and task querying via Flowable.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("WorkflowService")
class WorkflowServiceTest {

    @Mock
    private WorkflowDefinitionRepository definitionRepository;

    @Mock
    private WorkflowInstanceRepository instanceRepository;

    @Mock
    private RuntimeService runtimeService;

    @Mock
    private TaskService taskService;

    @InjectMocks
    private WorkflowService workflowService;

    private WorkflowDefinition testDefinition;
    private WorkflowInstance testInstance;
    private UUID tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        testDefinition = WorkflowDefinition.builder()
                .name("Incident Triage")
                .description("Incident triage process")
                .processDefinitionKey("incident-triage")
                .version(1)
                .active(true)
                .tenantId(tenantId)
                .build();
        testDefinition.setId(UUID.randomUUID());
        testDefinition.setCreatedAt(LocalDateTime.now());
        testDefinition.setUpdatedAt(LocalDateTime.now());

        testInstance = WorkflowInstance.builder()
                .workflowDefinitionId(testDefinition.getId())
                .processInstanceId("proc-123")
                .status(WorkflowInstance.InstanceStatus.RUNNING)
                .tenantId(tenantId)
                .build();
        testInstance.setId(UUID.randomUUID());
        testInstance.setCreatedAt(LocalDateTime.now());
        testInstance.setUpdatedAt(LocalDateTime.now());
    }

    @Nested
    @DisplayName("createDefinition")
    class CreateDefinitionTests {

        @Test
        @DisplayName("should create workflow definition")
        void shouldCreateDefinition_whenValidRequest_givenAllFields() {
            WorkflowDefinitionRequest request = WorkflowDefinitionRequest.builder()
                    .name("Approval Process")
                    .description("Multi-step approval")
                    .processDefinitionKey("approval-process")
                    .bpmnXml("<definitions></definitions>")
                    .build();

            when(definitionRepository.save(any(WorkflowDefinition.class))).thenAnswer(invocation -> {
                WorkflowDefinition def = invocation.getArgument(0);
                def.setId(UUID.randomUUID());
                def.setCreatedAt(LocalDateTime.now());
                def.setUpdatedAt(LocalDateTime.now());
                return def;
            });

            WorkflowDefinitionResponse response = workflowService.createDefinition(request);

            assertThat(response).isNotNull();
            assertThat(response.getName()).isEqualTo("Approval Process");
            assertThat(response.getProcessDefinitionKey()).isEqualTo("approval-process");
        }
    }

    @Nested
    @DisplayName("startWorkflow")
    class StartWorkflowTests {

        @Test
        @DisplayName("should start workflow and create Flowable process instance")
        void shouldStartWorkflow_whenValid_givenDefinitionAndVariables() {
            Map<String, Object> variables = new HashMap<>();
            variables.put("incidentId", UUID.randomUUID().toString());
            variables.put("priority", "HIGH");

            ProcessInstanceBuilder builder = mock(ProcessInstanceBuilder.class);
            ProcessInstance processInstance = mock(ProcessInstance.class);

            when(definitionRepository.findById(testDefinition.getId())).thenReturn(Optional.of(testDefinition));
            when(runtimeService.createProcessInstanceBuilder()).thenReturn(builder);
            when(builder.processDefinitionKey("incident-triage")).thenReturn(builder);
            when(builder.variables(any(Map.class))).thenReturn(builder);
            when(builder.start()).thenReturn(processInstance);
            when(processInstance.getId()).thenReturn("proc-inst-001");
            when(processInstance.getBusinessKey()).thenReturn("BK-001");

            when(instanceRepository.save(any(WorkflowInstance.class))).thenAnswer(invocation -> {
                WorkflowInstance inst = invocation.getArgument(0);
                inst.setId(UUID.randomUUID());
                inst.setCreatedAt(LocalDateTime.now());
                inst.setUpdatedAt(LocalDateTime.now());
                return inst;
            });

            WorkflowInstanceResponse response = workflowService.startWorkflow(testDefinition.getId(), variables);

            assertThat(response).isNotNull();
            assertThat(response.getProcessInstanceId()).isEqualTo("proc-inst-001");
            assertThat(response.getStatus()).isEqualTo("RUNNING");
            assertThat(response.getWorkflowDefinitionId()).isEqualTo(testDefinition.getId());

            verify(instanceRepository).save(any(WorkflowInstance.class));
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when definition not found")
        void shouldThrowNotFoundException_whenDefinitionMissing_givenInvalidId() {
            UUID randomId = UUID.randomUUID();
            when(definitionRepository.findById(randomId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> workflowService.startWorkflow(randomId, new HashMap<>()))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("completeTask")
    class CompleteTaskTests {

        @Test
        @DisplayName("should complete task without variables")
        void shouldCompleteTask_whenValid_givenTaskId() {
            Task task = mock(Task.class);
            when(task.getId()).thenReturn("task-001");
            when(taskService.createTaskQuery().taskId("task-001")).thenReturn(
                    new org.flowable.engine.impl.TaskQueryImpl(mock(org.flowable.common.engine.impl.persistence.StrongUuidGenerator.class)) {
                        @Override
                        public Task singleResult() { return task; }
                    }
            );

            // Use a simpler approach
            org.flowable.TaskService ts = taskService;
            var taskQuery = mock(org.flowable.task.api.TaskQuery.class);
            when(taskService.createTaskQuery()).thenReturn(taskQuery);
            when(taskQuery.taskId("task-001")).thenReturn(taskQuery);
            when(taskQuery.singleResult()).thenReturn(task);

            workflowService.completeTask("task-001", null);

            verify(taskService).complete("task-001");
        }

        @Test
        @DisplayName("should complete task with variables")
        void shouldCompleteTaskWithVars_whenValid_givenTaskIdAndVariables() {
            Task task = mock(Task.class);
            var taskQuery = mock(org.flowable.task.api.TaskQuery.class);
            when(taskService.createTaskQuery()).thenReturn(taskQuery);
            when(taskQuery.taskId("task-002")).thenReturn(taskQuery);
            when(taskQuery.singleResult()).thenReturn(task);

            Map<String, Object> vars = Map.of("approved", true);
            workflowService.completeTask("task-002", vars);

            verify(taskService).complete("task-002", vars);
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when task not found")
        void shouldThrowNotFoundException_whenTaskMissing_givenInvalidTaskId() {
            var taskQuery = mock(org.flowable.task.api.TaskQuery.class);
            when(taskService.createTaskQuery()).thenReturn(taskQuery);
            when(taskQuery.taskId("nonexistent")).thenReturn(taskQuery);
            when(taskQuery.singleResult()).thenReturn(null);

            assertThatThrownBy(() -> workflowService.completeTask("nonexistent", null))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Task");
        }
    }

    @Nested
    @DisplayName("getTasks")
    class GetTasksTests {

        @Test
        @DisplayName("should return tasks for a workflow instance")
        void shouldReturnTasks_whenValid_givenInstanceId() {
            when(instanceRepository.findById(testInstance.getId())).thenReturn(Optional.of(testInstance));

            Task task = mock(Task.class);
            when(task.getId()).thenReturn("task-001");
            when(task.getName()).thenReturn("Review Incident");
            when(task.getAssignee()).thenReturn("admin");

            var taskQuery = mock(org.flowable.task.api.TaskQuery.class);
            when(taskService.createTaskQuery()).thenReturn(taskQuery);
            when(taskQuery.processInstanceId("proc-123")).thenReturn(taskQuery);
            when(taskQuery.list()).thenReturn(List.of(task));

            List<WorkflowInstanceResponse.TaskResponse> tasks = workflowService.getTasks(testInstance.getId());

            assertThat(tasks).hasSize(1);
            assertThat(tasks.get(0).getTaskId()).isEqualTo("task-001");
            assertThat(tasks.get(0).getTaskName()).isEqualTo("Review Incident");
            assertThat(tasks.get(0).getAssignee()).isEqualTo("admin");
        }
    }
}
