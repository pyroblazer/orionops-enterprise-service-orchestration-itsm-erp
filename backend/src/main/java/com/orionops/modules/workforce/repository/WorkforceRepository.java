package com.orionops.modules.workforce.repository;

import com.orionops.modules.workforce.entity.CapacityPlan;
import com.orionops.modules.workforce.entity.Employee;
import com.orionops.modules.workforce.entity.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class WorkforceRepository {

    @Repository
    public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
        List<Employee> findByTenantIdAndDeletedAtIsNull(UUID tenantId);
        List<Employee> findByTenantIdAndEmploymentStatusAndDeletedAtIsNull(UUID tenantId, Employee.EmploymentStatus status);
        @Query(value = "SELECT e.* FROM employees e JOIN employee_skills es ON e.id = es.employee_id " +
                "JOIN skills s ON es.skill_id = s.id WHERE s.name IN (:skills) AND e.tenant_id = :tenantId " +
                "AND e.deleted_at IS NULL", nativeQuery = true)
        List<Employee> findBySkills(@Param("tenantId") UUID tenantId, @Param("skills") List<String> skills);

        @Query(value = "SELECT e.* FROM employees e WHERE e.tenant_id = :tenantId AND e.employment_status = 'ACTIVE' AND e.deleted_at IS NULL", nativeQuery = true)
        List<Employee> findAvailableEmployees(@Param("tenantId") UUID tenantId);

        @Query(value = "SELECT DISTINCT e.* FROM employees e JOIN employee_skills es ON e.id = es.employee_id " +
                "WHERE es.skill_id = :skillId AND e.tenant_id = :tenantId AND e.employment_status = 'ACTIVE' AND e.deleted_at IS NULL", nativeQuery = true)
        List<Employee> findBySkillAndAvailability(@Param("tenantId") UUID tenantId, @Param("skillId") UUID skillId, @Param("date") LocalDate date);
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
