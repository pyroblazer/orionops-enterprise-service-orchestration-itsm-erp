package com.orionops.workflow;

import org.flowable.engine.ProcessEngine;
import org.flowable.engine.RuntimeService;
import org.flowable.engine.TaskService;
import org.flowable.engine.runtime.ProcessInstance;
import org.flowable.task.api.Task;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
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
@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
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
    }

    @Autowired
    private ProcessEngine processEngine;

    @Autowired
    private RuntimeService runtimeService;

    @Autowired
    private TaskService taskService;

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
            variables.put("riskLevel", "high");
            variables.put("riskScore", 85);

            ProcessInstance instance = runtimeService.createProcessInstanceBuilder()
                    .processDefinitionKey("changeApproval")
                    .variables(variables)
                    .start();

            assertThat(instance).isNotNull();

            // After risk assessment service task, should have approval task
            List<Task> tasks = taskService.createTaskQuery()
                    .processInstanceId(instance.getProcessInstanceId())
                    .list();

            assertThat(tasks).isNotEmpty();
            assertThat(tasks.get(0).getName()).isEqualTo("Manager Approval");
        }

        @Test
        @DisplayName("should complete process after approval of high risk change")
        void shouldCompleteProcess_whenApproved_givenHighRiskTask() {
            Map<String, Object> variables = new HashMap<>();
            variables.put("changeId", "chg-002");
            variables.put("riskLevel", "high");
            variables.put("riskScore", 90);

            ProcessInstance instance = runtimeService.createProcessInstanceBuilder()
                    .processDefinitionKey("changeApproval")
                    .variables(variables)
                    .start();

            Task approvalTask = taskService.createTaskQuery()
                    .processInstanceId(instance.getProcessInstanceId())
                    .singleResult();

            assertThat(approvalTask).isNotNull();
            assertThat(approvalTask.getName()).isEqualTo("Manager Approval");

            Map<String, Object> approvalVars = new HashMap<>();
            approvalVars.put("approved", true);
            taskService.complete(approvalTask.getId(), approvalVars);

            // Process should have completed
            Task remainingTask = taskService.createTaskQuery()
                    .processInstanceId(instance.getProcessInstanceId())
                    .singleResult();
            assertThat(remainingTask).isNull();
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
        @DisplayName("should auto-approve low risk changes")
        void shouldAutoApprove_whenLowRisk_givenRiskAssessment() {
            Map<String, Object> variables = new HashMap<>();
            variables.put("changeId", "chg-003");
            variables.put("riskLevel", "low");
            variables.put("riskScore", 15);

            ProcessInstance instance = runtimeService.createProcessInstanceBuilder()
                    .processDefinitionKey("changeApproval")
                    .variables(variables)
                    .start();

            // Low risk should go through auto-approval (no manager approval task)
            List<Task> tasks = taskService.createTaskQuery()
                    .processInstanceId(instance.getProcessInstanceId())
                    .list();

            // Low risk path should not have "Manager Approval" task
            assertThat(tasks.stream().noneMatch(t -> "Manager Approval".equals(t.getName())))
                    .isTrue();
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
            variables.put("riskLevel", "high");
            variables.put("riskScore", 80);

            ProcessInstance instance = runtimeService.createProcessInstanceBuilder()
                    .processDefinitionKey("changeApproval")
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
