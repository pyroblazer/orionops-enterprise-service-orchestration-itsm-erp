package com.orionops.workflow;

import org.flowable.engine.ProcessEngine;
import org.flowable.engine.RuntimeService;
import org.flowable.engine.TaskService;
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
import jakarta.mail.Store;
import org.flowable.engine.delegate.JavaDelegate;
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
 * Workflow simulation tests for the Change Approval BPMN process.
 * Tests multi-step approval, rejection path, and conditional gateway based on risk level.
 */
@SpringBootTest(properties = {
    "spring.kafka.enabled=false",
    "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration,org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration",
    "flowable.database-schema-update=true"
})
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
@Tag("docker")
@DisplayName("Change Approval Workflow")
class ChangeApprovalWorkflowTest {

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
        registry.add("flowable.database-schema-update", () -> "true");
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

    @MockBean
    @SuppressWarnings("unused")
    private Store imapStore;

    @MockBean(name = "riskAssessmentDelegate")
    @SuppressWarnings("unused")
    private JavaDelegate riskAssessmentDelegate;

    @MockBean(name = "completionNotificationDelegate")
    @SuppressWarnings("unused")
    private JavaDelegate completionNotificationDelegate;

    @MockBean(name = "rejectionNotificationDelegate")
    @SuppressWarnings("unused")
    private JavaDelegate rejectionNotificationDelegate;

    @MockBean(name = "emergencyAutoApprovalDelegate")
    @SuppressWarnings("unused")
    private JavaDelegate emergencyAutoApprovalDelegate;

    @BeforeEach
    void cleanUp() {
        processEngine.getRepositoryService().createDeploymentQuery().list().forEach(deployment -> {
            processEngine.getRepositoryService().deleteDeployment(deployment.getId(), true);
        });
    }

    @Nested
    @DisplayName("high risk approval")
    class HighRiskApprovalTests {

        @BeforeEach
        void deployProcess() {
            processEngine.getRepositoryService().createDeployment()
                    .addClasspathResource("workflows/change-approval.bpmn20.xml")
                    .name("change-approval-test")
                    .deploy();
        }

        @Test
        @DisplayName("should require manager approval for high risk changes")
        void shouldRequireManagerApproval_whenHighRisk_givenRiskAssessment() {
            Map<String, Object> variables = new HashMap<>();
            variables.put("changeId", "chg-001");
            variables.put("changeType", "normal");
            variables.put("riskLevel", "high");
            variables.put("riskScore", 85);

            ProcessInstance instance = runtimeService.createProcessInstanceBuilder()
                    .processDefinitionKey("changeApprovalProcess")
                    .variables(variables)
                    .start();

            assertThat(instance).isNotNull();

            // After risk assessment service task, should have approval task
            List<Task> tasks = taskService.createTaskQuery()
                    .processInstanceId(instance.getProcessInstanceId())
                    .list();

            assertThat(tasks).isNotEmpty();
            assertThat(tasks.get(0).getName()).isEqualTo("CAB Approval");
        }

        @Test
        @DisplayName("should advance to implementation after approval of high risk change")
        void shouldCompleteProcess_whenApproved_givenHighRiskTask() {
            Map<String, Object> variables = new HashMap<>();
            variables.put("changeId", "chg-002");
            variables.put("changeType", "normal");
            variables.put("riskLevel", "high");
            variables.put("riskScore", 90);

            ProcessInstance instance = runtimeService.createProcessInstanceBuilder()
                    .processDefinitionKey("changeApprovalProcess")
                    .variables(variables)
                    .start();

            Task approvalTask = taskService.createTaskQuery()
                    .processInstanceId(instance.getProcessInstanceId())
                    .singleResult();

            assertThat(approvalTask).isNotNull();
            assertThat(approvalTask.getName()).isEqualTo("CAB Approval");

            Map<String, Object> approvalVars = new HashMap<>();
            approvalVars.put("approved", true);
            taskService.complete(approvalTask.getId(), approvalVars);

            // After CAB approval, process advances to implementation task
            Task implementTask = taskService.createTaskQuery()
                    .processInstanceId(instance.getProcessInstanceId())
                    .singleResult();
            assertThat(implementTask).isNotNull();
            assertThat(implementTask.getName()).isEqualTo("Implement Change");
        }
    }

    @Nested
    @DisplayName("low risk path")
    class LowRiskPathTests {

        @BeforeEach
        void deployProcess() {
            processEngine.getRepositoryService().createDeployment()
                    .addClasspathResource("workflows/change-approval.bpmn20.xml")
                    .name("change-approval-test")
                    .deploy();
        }

        @Test
        @DisplayName("should require manager approval for low risk normal changes")
        void shouldAutoApprove_whenLowRisk_givenRiskAssessment() {
            Map<String, Object> variables = new HashMap<>();
            variables.put("changeId", "chg-003");
            variables.put("changeType", "normal");
            variables.put("riskLevel", "low");
            variables.put("riskScore", 15);

            ProcessInstance instance = runtimeService.createProcessInstanceBuilder()
                    .processDefinitionKey("changeApprovalProcess")
                    .variables(variables)
                    .start();

            // Low risk normal changes still require manager approval
            List<Task> tasks = taskService.createTaskQuery()
                    .processInstanceId(instance.getProcessInstanceId())
                    .list();

            assertThat(tasks).isNotEmpty();
            assertThat(tasks.get(0).getName()).isEqualTo("Manager Approval");
        }
    }

    @Nested
    @DisplayName("rejection path")
    class RejectionPathTests {

        @BeforeEach
        void deployProcess() {
            processEngine.getRepositoryService().createDeployment()
                    .addClasspathResource("workflows/change-approval.bpmn20.xml")
                    .name("change-approval-test")
                    .deploy();
        }

        @Test
        @DisplayName("should handle rejection of change request")
        void shouldHandleRejection_whenManagerRejects_givenHighRiskChange() {
            Map<String, Object> variables = new HashMap<>();
            variables.put("changeId", "chg-004");
            variables.put("changeType", "normal");
            variables.put("riskLevel", "high");
            variables.put("riskScore", 80);

            ProcessInstance instance = runtimeService.createProcessInstanceBuilder()
                    .processDefinitionKey("changeApprovalProcess")
                    .variables(variables)
                    .start();

            Task approvalTask = taskService.createTaskQuery()
                    .processInstanceId(instance.getProcessInstanceId())
                    .singleResult();

            assertThat(approvalTask).isNotNull();

            Map<String, Object> rejectionVars = new HashMap<>();
            rejectionVars.put("approved", false);
            rejectionVars.put("rejectionReason", "Insufficient rollback plan");
            taskService.complete(approvalTask.getId(), rejectionVars);

            // After rejection, process should complete (no more tasks)
            Task remainingTask = taskService.createTaskQuery()
                    .processInstanceId(instance.getProcessInstanceId())
                    .singleResult();
            assertThat(remainingTask).isNull();
        }
    }
}
