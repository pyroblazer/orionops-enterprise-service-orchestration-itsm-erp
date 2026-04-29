package com.orionops.modules.problem.controller;

import com.orionops.common.dto.ApiResponse;
import com.orionops.common.dto.PagedResponse;
import com.orionops.modules.problem.dto.ProblemRequest;
import com.orionops.modules.problem.dto.ProblemResponse;
import com.orionops.modules.problem.entity.Problem;
import com.orionops.modules.problem.service.ProblemService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST controller for problem management operations.
 */
@RestController
@RequestMapping("/api/v1/problems")
@RequiredArgsConstructor
@Tag(name = "Problems", description = "Problem management operations")
public class ProblemController {

    private final ProblemService problemService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ProblemResponse>> createProblem(@Valid @RequestBody ProblemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(problemService.createProblem(request), "Problem created successfully"));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('AGENT', 'ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<ProblemResponse>>> listProblems(
            @RequestParam(required = false) Problem.ProblemStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "DESC") String direction) {
        Page<ProblemResponse> result = problemService.listProblems(status, search, page, size, sort, direction);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(result)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('AGENT', 'ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ProblemResponse>> getProblem(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(problemService.getProblem(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ProblemResponse>> updateProblem(
            @PathVariable UUID id, @Valid @RequestBody ProblemRequest request) {
        return ResponseEntity.ok(ApiResponse.success(problemService.updateProblem(id, request), "Problem updated"));
    }

    @PatchMapping("/{id}/link-incident")
    @PreAuthorize("hasAnyRole('ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ProblemResponse>> linkIncident(
            @PathVariable UUID id, @RequestParam UUID incidentId) {
        return ResponseEntity.ok(ApiResponse.success(problemService.linkIncident(id, incidentId), "Incident linked"));
    }

    @PatchMapping("/{id}/root-cause")
    @PreAuthorize("hasAnyRole('ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ProblemResponse>> setRootCause(
            @PathVariable UUID id, @RequestParam String rootCause) {
        return ResponseEntity.ok(ApiResponse.success(problemService.setRootCause(id, rootCause), "Root cause set"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteProblem(@PathVariable UUID id) {
        problemService.deleteProblem(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Problem deleted"));
    }
}
