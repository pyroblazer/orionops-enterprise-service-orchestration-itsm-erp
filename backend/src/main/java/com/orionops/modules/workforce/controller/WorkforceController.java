package com.orionops.modules.workforce.controller;

import com.orionops.common.dto.ApiResponse;
import com.orionops.modules.workforce.dto.WorkforceDTO;
import com.orionops.modules.workforce.service.WorkforceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workforce")
@RequiredArgsConstructor
@Tag(name = "Workforce", description = "Workforce management")
public class WorkforceController {

    private final WorkforceService workforceService;

    @PostMapping("/employees")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<ApiResponse<WorkforceDTO.EmployeeResponse>> createEmployee(@Valid @RequestBody WorkforceDTO.EmployeeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(workforceService.createEmployee(request), "Employee created"));
    }

    @GetMapping("/employees")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'HR_MANAGER')")
    public ResponseEntity<ApiResponse<List<WorkforceDTO.EmployeeResponse>>> listEmployees() {
        return ResponseEntity.ok(ApiResponse.success(workforceService.listEmployees()));
    }

    @GetMapping("/employees/{id}")
    @Operation(summary = "Get employee", description = "Retrieves an employee by ID")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'HR_MANAGER')")
    public ResponseEntity<ApiResponse<WorkforceDTO.EmployeeResponse>> getEmployee(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(workforceService.getEmployee(id)));
    }

    @PutMapping("/employees/{id}")
    @Operation(summary = "Update employee", description = "Updates an existing employee")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<ApiResponse<WorkforceDTO.EmployeeResponse>> updateEmployee(
            @PathVariable UUID id, @Valid @RequestBody WorkforceDTO.EmployeeRequest request) {
        return ResponseEntity.ok(ApiResponse.success(workforceService.updateEmployee(id, request), "Employee updated"));
    }

    @DeleteMapping("/employees/{id}")
    @Operation(summary = "Delete employee", description = "Soft-deletes an employee")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteEmployee(@PathVariable UUID id) {
        workforceService.deleteEmployee(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Employee deleted"));
    }

    @GetMapping("/employees/by-skills")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'HR_MANAGER')")
    public ResponseEntity<ApiResponse<List<WorkforceDTO.EmployeeResponse>>> findBySkills(@RequestParam List<String> skills) {
        return ResponseEntity.ok(ApiResponse.success(workforceService.findBySkills(skills)));
    }

    @PostMapping("/skills")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<ApiResponse<WorkforceDTO.SkillResponse>> createSkill(@Valid @RequestBody WorkforceDTO.SkillRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(workforceService.createSkill(request), "Skill created"));
    }

    @GetMapping("/skills")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'HR_MANAGER')")
    public ResponseEntity<ApiResponse<List<WorkforceDTO.SkillResponse>>> listSkills() {
        return ResponseEntity.ok(ApiResponse.success(workforceService.listSkills()));
    }

    @GetMapping("/skills/{id}")
    @Operation(summary = "Get skill", description = "Retrieves a skill by ID")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'HR_MANAGER')")
    public ResponseEntity<ApiResponse<WorkforceDTO.SkillResponse>> getSkill(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(workforceService.getSkill(id)));
    }

    @PutMapping("/skills/{id}")
    @Operation(summary = "Update skill", description = "Updates an existing skill")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<ApiResponse<WorkforceDTO.SkillResponse>> updateSkill(
            @PathVariable UUID id, @Valid @RequestBody WorkforceDTO.SkillRequest request) {
        return ResponseEntity.ok(ApiResponse.success(workforceService.updateSkill(id, request), "Skill updated"));
    }

    @DeleteMapping("/skills/{id}")
    @Operation(summary = "Delete skill", description = "Soft-deletes a skill")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteSkill(@PathVariable UUID id) {
        workforceService.deleteSkill(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Skill deleted"));
    }

    @PostMapping("/capacity")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<ApiResponse<WorkforceDTO.CapacityPlanResponse>> createCapacityPlan(@Valid @RequestBody WorkforceDTO.CapacityPlanRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(workforceService.createCapacityPlan(request), "Capacity plan created"));
    }

    @GetMapping("/capacity/{id}")
    @Operation(summary = "Get capacity plan", description = "Retrieves a capacity plan by ID")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'HR_MANAGER')")
    public ResponseEntity<ApiResponse<WorkforceDTO.CapacityPlanResponse>> getCapacityPlan(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(workforceService.getCapacityPlan(id)));
    }

    @PutMapping("/capacity/{id}")
    @Operation(summary = "Update capacity plan", description = "Updates an existing capacity plan")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<ApiResponse<WorkforceDTO.CapacityPlanResponse>> updateCapacityPlan(
            @PathVariable UUID id, @Valid @RequestBody WorkforceDTO.CapacityPlanRequest request) {
        return ResponseEntity.ok(ApiResponse.success(workforceService.updateCapacityPlan(id, request), "Capacity plan updated"));
    }

    @DeleteMapping("/capacity/{id}")
    @Operation(summary = "Delete capacity plan", description = "Soft-deletes a capacity plan")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCapacityPlan(@PathVariable UUID id) {
        workforceService.deleteCapacityPlan(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Capacity plan deleted"));
    }

    @GetMapping("/capacity")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'HR_MANAGER')")
    public ResponseEntity<ApiResponse<WorkforceDTO.CapacityOverview>> getCapacityOverview() {
        return ResponseEntity.ok(ApiResponse.success(workforceService.getCapacityOverview()));
    }
}
