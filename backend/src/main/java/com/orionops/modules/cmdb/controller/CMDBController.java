package com.orionops.modules.cmdb.controller;

import com.orionops.common.dto.ApiResponse;
import com.orionops.modules.cmdb.dto.CIRequest;
import com.orionops.modules.cmdb.dto.CIResponse;
import com.orionops.modules.cmdb.dto.CIRelationshipResponse;
import com.orionops.modules.cmdb.dto.ServiceRequest;
import com.orionops.modules.cmdb.dto.ServiceResponse;
import com.orionops.modules.cmdb.entity.ConfigurationItem;
import com.orionops.modules.cmdb.service.CMDBService;
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
@RequestMapping("/api/v1/cmdb")
@RequiredArgsConstructor
@Tag(name = "CMDB", description = "Configuration Management Database operations")
public class CMDBController {

    private final CMDBService cmdbService;

    // --- Configuration Items ---

    @PostMapping("/ci")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<CIResponse>> createCI(@Valid @RequestBody CIRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(cmdbService.createCI(request), "CI created"));
    }

    @GetMapping("/ci")
    @PreAuthorize("hasAnyRole('AGENT', 'ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<CIResponse>>> listCIs(
            @RequestParam(required = false) ConfigurationItem.CIType type,
            @RequestParam(required = false) ConfigurationItem.CIStatus status,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(ApiResponse.success(cmdbService.listCIs(type, status, search)));
    }

    @GetMapping("/ci/{id}")
    @PreAuthorize("hasAnyRole('AGENT', 'ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<CIResponse>> getCI(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(cmdbService.getCI(id)));
    }

    @PutMapping("/ci/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<CIResponse>> updateCI(@PathVariable UUID id, @Valid @RequestBody CIRequest request) {
        return ResponseEntity.ok(ApiResponse.success(cmdbService.updateCI(id, request), "CI updated"));
    }

    @DeleteMapping("/ci/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCI(@PathVariable UUID id) {
        cmdbService.deleteCI(id);
        return ResponseEntity.ok(ApiResponse.success(null, "CI deleted"));
    }

    @GetMapping("/ci/{id}/relationships")
    @PreAuthorize("hasAnyRole('AGENT', 'ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<CIRelationshipResponse>>> getRelationships(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(cmdbService.getRelationships(id)));
    }

    @GetMapping("/ci/{id}/impact-analysis")
    @PreAuthorize("hasAnyRole('ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<CIResponse>>> getImpactAnalysis(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(cmdbService.getImpactAnalysis(id)));
    }

    @PostMapping("/ci/{sourceId}/relate/{targetId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<CIRelationshipResponse>> createRelationship(
            @PathVariable UUID sourceId, @PathVariable UUID targetId,
            @RequestParam String type, @RequestParam(required = false) String description) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(cmdbService.createRelationship(sourceId, targetId, type, description), "Relationship created"));
    }

    // --- Services ---

    @PostMapping("/services")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ServiceResponse>> createService(@Valid @RequestBody ServiceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(cmdbService.createService(request), "Service created"));
    }

    @GetMapping("/services")
    @PreAuthorize("hasAnyRole('AGENT', 'ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<ServiceResponse>>> listServices() {
        return ResponseEntity.ok(ApiResponse.success(cmdbService.listServices()));
    }

    @GetMapping("/services/{id}")
    @PreAuthorize("hasAnyRole('AGENT', 'ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ServiceResponse>> getService(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(cmdbService.getService(id)));
    }

    @DeleteMapping("/services/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteService(@PathVariable UUID id) {
        cmdbService.deleteService(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Service deleted"));
    }
}
