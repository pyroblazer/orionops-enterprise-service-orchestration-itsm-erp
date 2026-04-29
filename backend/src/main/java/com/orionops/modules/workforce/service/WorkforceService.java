package com.orionops.modules.workforce.service;

import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.modules.workforce.dto.WorkforceDTO;
import com.orionops.modules.workforce.entity.CapacityPlan;
import com.orionops.modules.workforce.entity.Employee;
import com.orionops.modules.workforce.entity.Skill;
import com.orionops.modules.workforce.repository.WorkforceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkforceService {

    private final WorkforceRepository.EmployeeRepository employeeRepository;
    private final WorkforceRepository.SkillRepository skillRepository;
    private final WorkforceRepository.CapacityPlanRepository capacityPlanRepository;

    @Transactional
    public WorkforceDTO.EmployeeResponse createEmployee(WorkforceDTO.EmployeeRequest req) {
        Employee emp = Employee.builder()
                .firstName(req.getFirstName()).lastName(req.getLastName()).email(req.getEmail())
                .phone(req.getPhone()).department(req.getDepartment()).title(req.getTitle())
                .userId(req.getUserId()).location(req.getLocation()).tenantId(resolveTenantId()).build();
        return mapEmployee(employeeRepository.save(emp));
    }

    @Transactional(readOnly = true)
    public List<WorkforceDTO.EmployeeResponse> listEmployees() {
        return employeeRepository.findByTenantIdAndDeletedAtIsNull(resolveTenantId()).stream().map(this::mapEmployee).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WorkforceDTO.EmployeeResponse> findBySkills(List<String> skills) {
        return employeeRepository.findBySkills(resolveTenantId(), skills).stream().map(this::mapEmployee).collect(Collectors.toList());
    }

    @Transactional
    public WorkforceDTO.SkillResponse createSkill(WorkforceDTO.SkillRequest req) {
        Skill skill = Skill.builder().name(req.getName()).category(req.getCategory())
                .description(req.getDescription()).tenantId(resolveTenantId()).build();
        return mapSkill(skillRepository.save(skill));
    }

    @Transactional(readOnly = true)
    public List<WorkforceDTO.SkillResponse> listSkills() {
        return skillRepository.findByTenantIdAndDeletedAtIsNull(resolveTenantId()).stream().map(this::mapSkill).collect(Collectors.toList());
    }

    @Transactional
    public WorkforceDTO.CapacityPlanResponse createCapacityPlan(WorkforceDTO.CapacityPlanRequest req) {
        CapacityPlan plan = CapacityPlan.builder()
                .name(req.getName()).description(req.getDescription())
                .periodStart(req.getPeriodStart()).periodEnd(req.getPeriodEnd())
                .totalCapacity(req.getTotalCapacity()).allocatedCapacity(req.getAllocatedCapacity())
                .department(req.getDepartment()).tenantId(resolveTenantId()).build();
        return mapCapacityPlan(capacityPlanRepository.save(plan));
    }

    @Transactional(readOnly = true)
    public WorkforceDTO.CapacityOverview getCapacityOverview() {
        UUID tenantId = resolveTenantId();
        List<Employee> all = employeeRepository.findByTenantIdAndDeletedAtIsNull(tenantId);
        List<Employee> active = employeeRepository.findByTenantIdAndEmploymentStatusAndDeletedAtIsNull(tenantId, Employee.EmploymentStatus.ACTIVE);
        List<CapacityPlan> plans = capacityPlanRepository.findByTenantIdAndDeletedAtIsNull(tenantId);
        int totalCapacity = plans.stream().mapToInt(p -> p.getTotalCapacity() != null ? p.getTotalCapacity() : 0).sum();
        int allocatedCapacity = plans.stream().mapToInt(p -> p.getAllocatedCapacity() != null ? p.getAllocatedCapacity() : 0).sum();

        return WorkforceDTO.CapacityOverview.builder()
                .totalEmployees(all.size()).activeEmployees(active.size())
                .totalCapacity(totalCapacity).allocatedCapacity(allocatedCapacity)
                .plans(plans.stream().map(this::mapCapacityPlan).collect(Collectors.toList()))
                .build();
    }

    private UUID resolveTenantId() { return UUID.fromString("00000000-0000-0000-0000-000000000001"); }

    private WorkforceDTO.EmployeeResponse mapEmployee(Employee e) {
        return WorkforceDTO.EmployeeResponse.builder().id(e.getId()).firstName(e.getFirstName())
                .lastName(e.getLastName()).email(e.getEmail()).phone(e.getPhone())
                .department(e.getDepartment()).title(e.getTitle()).userId(e.getUserId())
                .employmentStatus(e.getEmploymentStatus() != null ? e.getEmploymentStatus().name() : null)
                .location(e.getLocation()).createdAt(e.getCreatedAt()).build();
    }

    private WorkforceDTO.SkillResponse mapSkill(Skill s) {
        return WorkforceDTO.SkillResponse.builder().id(s.getId()).name(s.getName())
                .category(s.getCategory()).description(s.getDescription()).createdAt(s.getCreatedAt()).build();
    }

    private WorkforceDTO.CapacityPlanResponse mapCapacityPlan(CapacityPlan p) {
        int available = (p.getTotalCapacity() != null ? p.getTotalCapacity() : 0) -
                (p.getAllocatedCapacity() != null ? p.getAllocatedCapacity() : 0);
        return WorkforceDTO.CapacityPlanResponse.builder().id(p.getId()).name(p.getName())
                .description(p.getDescription()).periodStart(p.getPeriodStart()).periodEnd(p.getPeriodEnd())
                .totalCapacity(p.getTotalCapacity()).allocatedCapacity(p.getAllocatedCapacity())
                .availableCapacity(available).department(p.getDepartment()).createdAt(p.getCreatedAt()).build();
    }
}
