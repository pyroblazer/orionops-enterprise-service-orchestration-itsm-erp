package com.orionops.modules.workforce.service;

import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.modules.workforce.dto.WorkforceDTO;
import com.orionops.modules.workforce.entity.CapacityPlan;
import com.orionops.modules.workforce.entity.Employee;
import com.orionops.modules.workforce.entity.Skill;
import com.orionops.modules.workforce.repository.WorkforceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link WorkforceService}.
 * Covers employee CRUD, skill CRUD, capacity planning, and workforce intelligence.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("WorkforceService")
class WorkforceServiceTest {

    @Mock
    private WorkforceRepository.EmployeeRepository employeeRepository;

    @Mock
    private WorkforceRepository.SkillRepository skillRepository;

    @Mock
    private WorkforceRepository.CapacityPlanRepository capacityPlanRepository;

    @InjectMocks
    private WorkforceService workforceService;

    private UUID employeeId;
    private UUID skillId;
    private UUID planId;

    @BeforeEach
    void setUp() {
        employeeId = UUID.randomUUID();
        skillId = UUID.randomUUID();
        planId = UUID.randomUUID();
    }

    // ================================================================
    // Employee CRUD
    // ================================================================

    @Nested
    @DisplayName("createEmployee")
    class CreateEmployeeTests {

        @Test
        @DisplayName("should create employee with all fields")
        void shouldCreate_withAllFields() {
            WorkforceDTO.EmployeeRequest request = WorkforceDTO.EmployeeRequest.builder()
                    .firstName("John").lastName("Doe").email("john@example.com")
                    .phone("+1-555-0100").department("Engineering").title("Senior Developer")
                    .userId(UUID.randomUUID()).location("New York")
                    .build();

            when(employeeRepository.save(any(Employee.class))).thenAnswer(inv -> {
                Employee emp = inv.getArgument(0);
                emp.setId(employeeId);
                return emp;
            });

            WorkforceDTO.EmployeeResponse response = workforceService.createEmployee(request);

            assertThat(response).isNotNull();
            assertThat(response.getFirstName()).isEqualTo("John");
            assertThat(response.getLastName()).isEqualTo("Doe");
            assertThat(response.getEmail()).isEqualTo("john@example.com");
            assertThat(response.getDepartment()).isEqualTo("Engineering");
            assertThat(response.getTitle()).isEqualTo("Senior Developer");
            assertThat(response.getLocation()).isEqualTo("New York");

            ArgumentCaptor<Employee> captor = ArgumentCaptor.forClass(Employee.class);
            verify(employeeRepository).save(captor.capture());
            assertThat(captor.getValue().getTenantId()).isNotNull();
        }
    }

    @Nested
    @DisplayName("getEmployee")
    class GetEmployeeTests {

        @Test
        @DisplayName("should return employee when found")
        void shouldReturn_whenFound() {
            Employee employee = buildTestEmployee();
            when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(employee));

            WorkforceDTO.EmployeeResponse response = workforceService.getEmployee(employeeId);

            assertThat(response.getFirstName()).isEqualTo("John");
            assertThat(response.getLastName()).isEqualTo("Doe");
            assertThat(response.getEmail()).isEqualTo("john@example.com");
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when employee not found")
        void shouldThrow_whenNotFound() {
            when(employeeRepository.findById(employeeId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> workforceService.getEmployee(employeeId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Employee");
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when employee is soft-deleted")
        void shouldThrow_whenSoftDeleted() {
            Employee employee = buildTestEmployee();
            employee.softDelete();
            when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(employee));

            assertThatThrownBy(() -> workforceService.getEmployee(employeeId))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("updateEmployee")
    class UpdateEmployeeTests {

        @Test
        @DisplayName("should update all fields")
        void shouldUpdate_allFields() {
            Employee employee = buildTestEmployee();
            when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(employee));
            when(employeeRepository.save(any(Employee.class))).thenAnswer(inv -> inv.getArgument(0));

            WorkforceDTO.EmployeeRequest request = WorkforceDTO.EmployeeRequest.builder()
                    .firstName("Jane").lastName("Smith").email("jane@example.com")
                    .phone("+1-555-0200").department("Product").title("PM")
                    .userId(UUID.randomUUID()).location("London")
                    .build();

            WorkforceDTO.EmployeeResponse response = workforceService.updateEmployee(employeeId, request);

            assertThat(response.getFirstName()).isEqualTo("Jane");
            assertThat(response.getLastName()).isEqualTo("Smith");
            assertThat(response.getEmail()).isEqualTo("jane@example.com");
        }
    }

    @Nested
    @DisplayName("deleteEmployee")
    class DeleteEmployeeTests {

        @Test
        @DisplayName("should soft-delete employee")
        void shouldSoftDelete() {
            Employee employee = buildTestEmployee();
            when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(employee));
            when(employeeRepository.save(any(Employee.class))).thenAnswer(inv -> inv.getArgument(0));

            workforceService.deleteEmployee(employeeId);

            ArgumentCaptor<Employee> captor = ArgumentCaptor.forClass(Employee.class);
            verify(employeeRepository).save(captor.capture());
            assertThat(captor.getValue().getDeletedAt()).isNotNull();
        }
    }

    @Nested
    @DisplayName("listEmployees")
    class ListEmployeesTests {

        @Test
        @DisplayName("should return employees for tenant")
        void shouldReturn_forTenant() {
            when(employeeRepository.findByTenantIdAndDeletedAtIsNull(any(UUID.class)))
                    .thenReturn(Collections.emptyList());

            List<WorkforceDTO.EmployeeResponse> result = workforceService.listEmployees();

            assertThat(result).isEmpty();
            verify(employeeRepository).findByTenantIdAndDeletedAtIsNull(any(UUID.class));
        }
    }

    @Nested
    @DisplayName("findBySkills")
    class FindBySkillsTests {

        @Test
        @DisplayName("should delegate to repository native query")
        void shouldDelegate_toRepository() {
            Employee emp = buildTestEmployee();
            when(employeeRepository.findBySkills(any(UUID.class), eq(List.of("Java", "Spring"))))
                    .thenReturn(List.of(emp));

            List<WorkforceDTO.EmployeeResponse> result = workforceService.findBySkills(List.of("Java", "Spring"));

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getFirstName()).isEqualTo("John");
            verify(employeeRepository).findBySkills(any(UUID.class), eq(List.of("Java", "Spring")));
        }
    }

    // ================================================================
    // Skill CRUD
    // ================================================================

    @Nested
    @DisplayName("Skill CRUD")
    class SkillCRUDTests {

        @Test
        @DisplayName("should create skill")
        void shouldCreateSkill() {
            WorkforceDTO.SkillRequest request = WorkforceDTO.SkillRequest.builder()
                    .name("Java").category("Programming").description("Java SE 21")
                    .build();
            when(skillRepository.save(any(Skill.class))).thenAnswer(inv -> {
                Skill s = inv.getArgument(0);
                s.setId(skillId);
                return s;
            });

            WorkforceDTO.SkillResponse response = workforceService.createSkill(request);

            assertThat(response.getName()).isEqualTo("Java");
            assertThat(response.getCategory()).isEqualTo("Programming");
        }

        @Test
        @DisplayName("should get skill by ID")
        void shouldGetSkill() {
            Skill skill = Skill.builder().name("Java").category("Programming").description("SE 21").build();
            skill.setId(skillId);
            when(skillRepository.findById(skillId)).thenReturn(Optional.of(skill));

            WorkforceDTO.SkillResponse response = workforceService.getSkill(skillId);

            assertThat(response.getName()).isEqualTo("Java");
        }

        @Test
        @DisplayName("should update skill")
        void shouldUpdateSkill() {
            Skill skill = Skill.builder().name("Java").build();
            skill.setId(skillId);
            when(skillRepository.findById(skillId)).thenReturn(Optional.of(skill));
            when(skillRepository.save(any(Skill.class))).thenAnswer(inv -> inv.getArgument(0));

            WorkforceDTO.SkillRequest request = WorkforceDTO.SkillRequest.builder()
                    .name("Kotlin").category("Programming").description("JVM Language").build();

            WorkforceDTO.SkillResponse response = workforceService.updateSkill(skillId, request);

            assertThat(response.getName()).isEqualTo("Kotlin");
        }

        @Test
        @DisplayName("should delete skill")
        void shouldDeleteSkill() {
            Skill skill = Skill.builder().name("Java").build();
            skill.setId(skillId);
            when(skillRepository.findById(skillId)).thenReturn(Optional.of(skill));
            when(skillRepository.save(any(Skill.class))).thenAnswer(inv -> inv.getArgument(0));

            workforceService.deleteSkill(skillId);

            ArgumentCaptor<Skill> captor = ArgumentCaptor.forClass(Skill.class);
            verify(skillRepository).save(captor.capture());
            assertThat(captor.getValue().getDeletedAt()).isNotNull();
        }
    }

    // ================================================================
    // Capacity Plans
    // ================================================================

    @Nested
    @DisplayName("createCapacityPlan")
    class CreateCapacityPlanTests {

        @Test
        @DisplayName("should create plan with all fields")
        void shouldCreate_withAllFields() {
            WorkforceDTO.CapacityPlanRequest request = WorkforceDTO.CapacityPlanRequest.builder()
                    .name("Q1 Plan").description("Quarter 1 capacity")
                    .periodStart(LocalDateTime.now()).periodEnd(LocalDateTime.now().plusMonths(3))
                    .totalCapacity(100).allocatedCapacity(60).department("Engineering")
                    .build();
            when(capacityPlanRepository.save(any(CapacityPlan.class))).thenAnswer(inv -> {
                CapacityPlan p = inv.getArgument(0);
                p.setId(planId);
                return p;
            });

            WorkforceDTO.CapacityPlanResponse response = workforceService.createCapacityPlan(request);

            assertThat(response.getName()).isEqualTo("Q1 Plan");
            assertThat(response.getTotalCapacity()).isEqualTo(100);
            assertThat(response.getAllocatedCapacity()).isEqualTo(60);
            assertThat(response.getAvailableCapacity()).isEqualTo(40); // 100 - 60
        }
    }

    @Nested
    @DisplayName("getCapacityOverview")
    class GetCapacityOverviewTests {

        @Test
        @DisplayName("should aggregate employees and plans")
        void shouldAggregate_allData() {
            Employee activeEmp = buildTestEmployee();
            Employee inactiveEmp = buildTestEmployee();
            inactiveEmp.setEmploymentStatus(Employee.EmploymentStatus.INACTIVE);

            CapacityPlan plan = CapacityPlan.builder()
                    .name("Plan A").totalCapacity(100).allocatedCapacity(75).build();
            plan.setId(planId);

            when(employeeRepository.findByTenantIdAndDeletedAtIsNull(any(UUID.class)))
                    .thenReturn(List.of(activeEmp, inactiveEmp));
            when(employeeRepository.findByTenantIdAndEmploymentStatusAndDeletedAtIsNull(
                    any(UUID.class), eq(Employee.EmploymentStatus.ACTIVE)))
                    .thenReturn(List.of(activeEmp));
            when(capacityPlanRepository.findByTenantIdAndDeletedAtIsNull(any(UUID.class)))
                    .thenReturn(List.of(plan));

            WorkforceDTO.CapacityOverview overview = workforceService.getCapacityOverview();

            assertThat(overview.getTotalEmployees()).isEqualTo(2);
            assertThat(overview.getActiveEmployees()).isEqualTo(1);
            assertThat(overview.getTotalCapacity()).isEqualTo(100);
            assertThat(overview.getAllocatedCapacity()).isEqualTo(75);
            assertThat(overview.getPlans()).hasSize(1);
        }

        @Test
        @DisplayName("should handle empty plans")
        void shouldHandle_emptyPlans() {
            when(employeeRepository.findByTenantIdAndDeletedAtIsNull(any(UUID.class)))
                    .thenReturn(Collections.emptyList());
            when(employeeRepository.findByTenantIdAndEmploymentStatusAndDeletedAtIsNull(
                    any(UUID.class), eq(Employee.EmploymentStatus.ACTIVE)))
                    .thenReturn(Collections.emptyList());
            when(capacityPlanRepository.findByTenantIdAndDeletedAtIsNull(any(UUID.class)))
                    .thenReturn(Collections.emptyList());

            WorkforceDTO.CapacityOverview overview = workforceService.getCapacityOverview();

            assertThat(overview.getTotalEmployees()).isEqualTo(0);
            assertThat(overview.getActiveEmployees()).isEqualTo(0);
            assertThat(overview.getTotalCapacity()).isEqualTo(0);
            assertThat(overview.getAllocatedCapacity()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("getCapacityUtilization")
    class GetCapacityUtilizationTests {

        @Test
        @DisplayName("should calculate utilization percentage")
        void shouldCalculate_utilizationPct() {
            CapacityPlan plan = CapacityPlan.builder()
                    .name("Plan").totalCapacity(100).allocatedCapacity(75).build();
            when(capacityPlanRepository.findByTenantIdAndDeletedAtIsNull(any(UUID.class)))
                    .thenReturn(List.of(plan));

            UUID tenantId = UUID.randomUUID();
            Map<String, Object> result = workforceService.getCapacityUtilization(
                    tenantId, LocalDate.now(), LocalDate.now().plusMonths(1));

            assertThat(result).containsEntry("totalCapacity", 100);
            assertThat(result).containsEntry("allocatedCapacity", 75);
            assertThat(result).containsEntry("availableCapacity", 25);
            assertThat(result).containsEntry("utilizationPercentage", 75.0);
        }

        @Test
        @DisplayName("should return zero when no capacity")
        void shouldReturnZero_whenNoCapacity() {
            when(capacityPlanRepository.findByTenantIdAndDeletedAtIsNull(any(UUID.class)))
                    .thenReturn(Collections.emptyList());

            Map<String, Object> result = workforceService.getCapacityUtilization(
                    UUID.randomUUID(), LocalDate.now(), LocalDate.now().plusMonths(1));

            assertThat(result).containsEntry("utilizationPercentage", 0.0);
            assertThat(result).containsEntry("totalCapacity", 0);
        }
    }

    @Nested
    @DisplayName("getOverloadedTeams")
    class GetOverloadedTeamsTests {

        @Test
        @DisplayName("should filter overloaded plans")
        void shouldFilter_overloadedPlans() {
            CapacityPlan overloaded = CapacityPlan.builder()
                    .name("Over").totalCapacity(100).allocatedCapacity(150).department("Engineering").build();
            CapacityPlan normal = CapacityPlan.builder()
                    .name("Normal").totalCapacity(100).allocatedCapacity(50).department("Marketing").build();

            when(capacityPlanRepository.findByTenantIdAndDeletedAtIsNull(any(UUID.class)))
                    .thenReturn(List.of(overloaded, normal));

            List<Map<String, Object>> result = workforceService.getOverloadedTeams(UUID.randomUUID());

            assertThat(result).hasSize(1);
            assertThat(result.get(0)).containsEntry("department", "Engineering");
            assertThat(result.get(0)).containsEntry("allocatedCapacity", 150);
            assertThat(result.get(0)).containsEntry("totalCapacity", 100);
        }

        @Test
        @DisplayName("should return empty when none overloaded")
        void shouldReturnEmpty_whenNoneOverloaded() {
            CapacityPlan normal = CapacityPlan.builder()
                    .totalCapacity(100).allocatedCapacity(50).build();
            when(capacityPlanRepository.findByTenantIdAndDeletedAtIsNull(any(UUID.class)))
                    .thenReturn(List.of(normal));

            List<Map<String, Object>> result = workforceService.getOverloadedTeams(UUID.randomUUID());

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("should compute overallocation percentage")
        void shouldCompute_overallocationPct() {
            CapacityPlan overloaded = CapacityPlan.builder()
                    .totalCapacity(100).allocatedCapacity(150).department("IT").build();
            when(capacityPlanRepository.findByTenantIdAndDeletedAtIsNull(any(UUID.class)))
                    .thenReturn(List.of(overloaded));

            List<Map<String, Object>> result = workforceService.getOverloadedTeams(UUID.randomUUID());

            // (150 - 100) * 100.0 / 100 = 50.0
            assertThat(result.get(0)).containsEntry("overallocationPct", 50.0);
        }
    }

    @Nested
    @DisplayName("suggestAssignee")
    class SuggestAssigneeTests {

        @Test
        @DisplayName("should return first available employee")
        void shouldReturn_firstAvailable() {
            Employee emp = buildTestEmployee();
            when(employeeRepository.findAvailableEmployees(any(UUID.class)))
                    .thenReturn(List.of(emp));

            WorkforceDTO.EmployeeResponse response = workforceService.suggestAssignee(UUID.randomUUID());

            assertThat(response).isNotNull();
            assertThat(response.getFirstName()).isEqualTo("John");
        }

        @Test
        @DisplayName("should return null when no candidates")
        void shouldReturnNull_whenNoCandidates() {
            when(employeeRepository.findAvailableEmployees(any(UUID.class)))
                    .thenReturn(Collections.emptyList());

            WorkforceDTO.EmployeeResponse response = workforceService.suggestAssignee(UUID.randomUUID());

            assertThat(response).isNull();
        }
    }

    @Nested
    @DisplayName("findAvailableEmployeesWithSkill")
    class FindAvailableWithSkillTests {

        @Test
        @DisplayName("should delegate to repository")
        void shouldDelegate_toRepository() {
            Employee emp = buildTestEmployee();
            when(employeeRepository.findBySkillAndAvailability(any(UUID.class), eq(skillId), any(LocalDate.class)))
                    .thenReturn(List.of(emp));

            List<WorkforceDTO.EmployeeResponse> result =
                    workforceService.findAvailableEmployeesWithSkill(skillId, LocalDate.now());

            assertThat(result).hasSize(1);
            verify(employeeRepository).findBySkillAndAvailability(any(UUID.class), eq(skillId), any(LocalDate.class));
        }
    }

    // ================================================================
    // Helpers
    // ================================================================

    private Employee buildTestEmployee() {
        Employee emp = Employee.builder()
                .firstName("John").lastName("Doe").email("john@example.com")
                .phone("+1-555-0100").department("Engineering").title("Developer")
                .location("New York")
                .build();
        emp.setId(employeeId);
        return emp;
    }
}
