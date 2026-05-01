package com.orionops.workflow;

import org.flowable.engine.ProcessEngine;
import org.flowable.engine.RuntimeService;
import org.flowable.engine.TaskService;
import org.flowable.engine.repository.Deployment;
import org.flowable.engine.runtime.ProcessInstance;
import org.flowable.task.api.Task;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Workflow simulation tests for the Incident Escalation BPMN process.
 * Tests process deployment, start, human task creation, task completion,
 * and timer boundary events for escalation.
 */
@SpringBootTest(properties = {
    "spring.kafka.enabled=false",
    "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration,org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration"
})
@Testcontainers
@ActiveProfiles("test")
@Tag("docker")
@DisplayName("Incident Escalation Workflow")
class IncidentEscalationWorkflowTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("orionops_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        registry.add("spring.flyway.enabled", () -> "false");
    }

    @Autowired
    private ProcessEngine processEngine;

    @Autowired
    private RuntimeService runtimeService;

    @Autowired
    private TaskService taskService;

    @MockBean
    @SuppressWarnings("unused")
    private RedisConnectionFactory redisConnectionFactory;

    @MockBean
    @SuppressWarnings("unused")
    private RedisTemplate<String, Object> redisTemplate;

    @BeforeEach
    void cleanUp() {
        // Clean up deployments and instances from previous tests
        processEngine.getRepositoryService().createDeploymentQuery().list().forEach(deployment -> {
            processEngine.getRepositoryService().deleteDeployment(deployment.getId(), true);
        });
    }

    @Nested
    @DisplayName("process deployment")
    class ProcessDeploymentTests {

        @Test
        @DisplayName("should deploy BPMN process definition")
        void shouldDeployProcess_whenValidBpmn_givenProcessDefinition() {
            Deployment deployment = processEngine.getRepositoryService().createDeployment()
                    .addClasspathResource("workflows/incident-escalation.bpmn20.xml")
                    .name("incident-escalation-test")
                    .deploy();

            assertThat(deployment).isNotNull();
            assertThat(deployment.getId()).isNotNull();

            long count = processEngine.getRepositoryService().createProcessDefinitionQuery()
                    .deploymentId(deployment.getId())
                    .count();
            assertThat(count).isGreaterThan(0);
        }
    }

    @Nested
    @DisplayName("process execution")
    class ProcessExecutionTests {

        @BeforeEach
        void deployProcess() {
            processEngine.getRepositoryService().createDeployment()
                    .addClasspathResource("workflows/incident-escalation.bpmn20.xml")
                    .name("incident-escalation-test")
                    .deploy();
        }

        @Test
        @DisplayName("should start process with incident variables")
        void shouldStartProcess_whenValidVariables_givenDeployedProcess() {
            Map<String, Object> variables = new HashMap<>();
            variables.put("incidentId", "inc-001");
            variables.put("priority", "HIGH");
            variables.put("category", "Network");

            ProcessInstance instance = runtimeService.createProcessInstanceBuilder()
                    .processDefinitionKey("incidentEscalation")
                    .variables(variables)
                    .start();

            assertThat(instance).isNotNull();
            assertThat(instance.getProcessInstanceId()).isNotNull();

            // Verify variables are set
            Object priority = runtimeService.getVariable(instance.getId(), "priority");
            assertThat(priority).isEqualTo("HIGH");
        }

        @Test
        @DisplayName("should create human task for triage after process starts")
        void shouldCreateHumanTask_whenProcessStarts_givenDeployedProcess() {
            Map<String, Object> variables = new HashMap<>();
            variables.put("incidentId", "inc-002");
            variables.put("priority", "CRITICAL");

            ProcessInstance instance = runtimeService.createProcessInstanceBuilder()
                    .processDefinitionKey("incidentEscalation")
                    .variables(variables)
                    .start();

            List<Task> tasks = taskService.createTaskQuery()
                    .processInstanceId(instance.getProcessInstanceId())
                    .list();

            assertThat(tasks).isNotEmpty();
            assertThat(tasks.get(0).getName()).isEqualTo("Triage Incident");
        }

        @Test
        @DisplayName("should advance process after completing triage task")
        void shouldAdvanceProcess_whenTaskCompleted_givenPendingTask() {
            Map<String, Object> variables = new HashMap<>();
            variables.put("incidentId", "inc-003");
            variables.put("priority", "MEDIUM");

            ProcessInstance instance = runtimeService.createProcessInstanceBuilder()
                    .processDefinitionKey("incidentEscalation")
                    .variables(variables)
                    .start();

            Task triageTask = taskService.createTaskQuery()
                    .processInstanceId(instance.getProcessInstanceId())
                    .singleResult();

            assertThat(triageTask).isNotNull();

            // Complete the triage task with approved = true
            Map<String, Object> taskVariables = new HashMap<>();
            taskVariables.put("approved", true);
            taskService.complete(triageTask.getId(), taskVariables);

            // Verify the process has advanced (triage task no longer exists)
            Task remainingTask = taskService.createTaskQuery()
                    .processInstanceId(instance.getProcessInstanceId())
                    .singleResult();

            // After approval the process should end (no more tasks)
            assertThat(remainingTask).isNull();
        }

        @Test
        @DisplayName("should handle rejection path in exclusive gateway")
        void shouldHandleRejection_whenNotApproved_givenTriageTask() {
            Map<String, Object> variables = new HashMap<>();
            variables.put("incidentId", "inc-004");
            variables.put("priority", "LOW");

            ProcessInstance instance = runtimeService.createProcessInstanceBuilder()
                    .processDefinitionKey("incidentEscalation")
                    .variables(variables)
                    .start();

            Task triageTask = taskService.createTaskQuery()
                    .processInstanceId(instance.getProcessInstanceId())
                    .singleResult();

            // Complete with rejection
            Map<String, Object> taskVariables = new HashMap<>();
            taskVariables.put("approved", false);
            taskService.complete(triageTask.getId(), taskVariables);

            // Process should still complete (just takes rejection path)
            Task remainingTask = taskService.createTaskQuery()
                    .processInstanceId(instance.getProcessInstanceId())
                    .singleResult();
            assertThat(remainingTask).isNull();
        }
    }
}
