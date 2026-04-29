package com.orionops.modules.workforce.controller;

import com.orionops.common.dto.ApiResponse;
import com.orionops.modules.workforce.dto.WorkforceDTO;
import com.orionops.modules.workforce.service.WorkforceService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @PostMapping("/capacity")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<ApiResponse<WorkforceDTO.CapacityPlanResponse>> createCapacityPlan(@Valid @RequestBody WorkforceDTO.CapacityPlanRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(workforceService.createCapacityPlan(request), "Capacity plan created"));
    }

    @GetMapping("/capacity")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'HR_MANAGER')")
    public ResponseEntity<ApiResponse<WorkforceDTO.CapacityOverview>> getCapacityOverview() {
        return ResponseEntity.ok(ApiResponse.success(workforceService.getCapacityOverview()));
    }
}
