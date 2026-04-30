package com.orionops.modules.sla.controller;

import com.orionops.common.dto.ApiResponse;
import com.orionops.common.dto.PagedResponse;
import com.orionops.modules.sla.dto.SLADefinitionRequest;
import com.orionops.modules.sla.dto.SLADefinitionResponse;
import com.orionops.modules.sla.dto.SLAInstanceResponse;
import com.orionops.modules.sla.entity.SLAInstance;
import com.orionops.modules.sla.service.SLAService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sla")
@RequiredArgsConstructor
@Tag(name = "SLA", description = "Service Level Agreement management")
public class SLAController {

    private final SLAService slaService;

    @PostMapping("/definitions")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<SLADefinitionResponse>> createDefinition(@Valid @RequestBody SLADefinitionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(slaService.createDefinition(request), "SLA definition created"));
    }

    @GetMapping("/definitions")
    @PreAuthorize("hasAnyRole('AGENT', 'ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<SLADefinitionResponse>>> listDefinitions() {
        return ResponseEntity.ok(ApiResponse.success(slaService.listDefinitions()));
    }

    @GetMapping("/definitions/{id}")
    @PreAuthorize("hasAnyRole('AGENT', 'ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<SLADefinitionResponse>> getDefinition(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(slaService.getDefinition(id)));
    }

    @PutMapping("/definitions/{id}")
    @Operation(summary = "Update SLA definition", description = "Updates an existing SLA definition")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<SLADefinitionResponse>> updateDefinition(
            @PathVariable UUID id, @Valid @RequestBody SLADefinitionRequest request) {
        return ResponseEntity.ok(ApiResponse.success(slaService.updateDefinition(id, request), "SLA definition updated"));
    }

    @DeleteMapping("/definitions/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteDefinition(@PathVariable UUID id) {
        slaService.deleteDefinition(id);
        return ResponseEntity.ok(ApiResponse.success(null, "SLA definition deleted"));
    }

    @PostMapping("/apply")
    @PreAuthorize("hasAnyRole('ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<SLAInstanceResponse>> applySLA(
            @RequestParam UUID definitionId, @RequestParam UUID targetEntityId, @RequestParam String targetType) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(slaService.applySLA(definitionId, targetEntityId, targetType), "SLA applied"));
    }

    @GetMapping("/instances")
    @PreAuthorize("hasAnyRole('AGENT', 'ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<SLAInstanceResponse>>> listInstances(
            @RequestParam(required = false) SLAInstance.SLAStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<SLAInstanceResponse> result = slaService.listInstances(status, page, size);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(result)));
    }
}
