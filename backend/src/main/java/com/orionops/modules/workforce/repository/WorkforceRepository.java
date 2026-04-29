package com.orionops.modules.workforce.repository;

import com.orionops.modules.workforce.entity.CapacityPlan;
import com.orionops.modules.workforce.entity.Employee;
import com.orionops.modules.workforce.entity.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

public class WorkforceRepository {

    @Repository
    public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
        List<Employee> findByTenantIdAndDeletedAtIsNull(UUID tenantId);
        List<Employee> findByTenantIdAndEmploymentStatusAndDeletedAtIsNull(UUID tenantId, Employee.EmploymentStatus status);
        @Query("SELECT e FROM Employee e JOIN EmployeeSkill es ON e.id = es.employeeId JOIN Skill s ON es.skillId = s.id " +
                "WHERE s.name IN :skills AND e.tenantId = :tenantId AND e.deletedAt IS NULL")
        List<Employee> findBySkills(@Param("tenantId") UUID tenantId, @Param("skills") List<String> skills);
    }

    @Repository
    public interface SkillRepository extends JpaRepository<Skill, UUID> {
        List<Skill> findByTenantIdAndDeletedAtIsNull(UUID tenantId);
    }

    @Repository
    public interface CapacityPlanRepository extends JpaRepository<CapacityPlan, UUID> {
        List<CapacityPlan> findByTenantIdAndDeletedAtIsNull(UUID tenantId);
    }
}
