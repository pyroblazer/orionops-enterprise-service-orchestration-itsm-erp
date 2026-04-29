package com.orionops.modules.incident.controller;

import com.orionops.common.dto.ApiResponse;
import com.orionops.common.dto.PagedResponse;
import com.orionops.modules.incident.dto.CreateIncidentRequest;
import com.orionops.modules.incident.dto.IncidentResponse;
import com.orionops.modules.incident.dto.UpdateIncidentRequest;
import com.orionops.modules.incident.entity.Incident;
import com.orionops.modules.incident.service.IncidentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * REST controller for incident management.
 * Provides full CRUD and lifecycle operations (assign, escalate, resolve, close)
 * with CQRS-style event sourcing on all state mutations.
 */
@RestController
@RequestMapping("/api/v1/incidents")
@RequiredArgsConstructor
@Tag(name = "Incidents", description = "Incident management operations")
public class IncidentController {

    private final IncidentService incidentService;

    @PostMapping
    @Operation(summary = "Create incident", description = "Creates a new incident and publishes an event")
    @PreAuthorize("hasAnyRole('AGENT', 'ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<IncidentResponse>> createIncident(
            @Valid @RequestBody CreateIncidentRequest request) {
        IncidentResponse response = incidentService.createIncident(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Incident created successfully"));
    }

    @GetMapping
    @Operation(summary = "List incidents", description = "Searches and lists incidents with pagination and filters")
    @PreAuthorize("hasAnyRole('AGENT', 'ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<IncidentResponse>>> listIncidents(
            @RequestParam(required = false) Incident.IncidentStatus status,
            @RequestParam(required = false) Incident.IncidentPriority priority,
            @RequestParam(required = false) UUID assigneeId,
            @RequestParam(required = false) UUID serviceId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "DESC") String direction) {

        Page<IncidentResponse> result = incidentService.searchIncidents(
                status, priority, assigneeId, serviceId, category, search,
                page, size, sort, direction);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(result)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get incident", description = "Retrieves an incident by ID")
    @PreAuthorize("hasAnyRole('AGENT', 'ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<IncidentResponse>> getIncident(@PathVariable UUID id) {
        IncidentResponse response = incidentService.getIncident(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update incident", description = "Updates an existing incident")
    @PreAuthorize("hasAnyRole('ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<IncidentResponse>> updateIncident(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateIncidentRequest request) {
        IncidentResponse response = incidentService.updateIncident(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Incident updated successfully"));
    }

    @PatchMapping("/{id}/assign")
    @Operation(summary = "Assign incident", description = "Assigns an incident to a user or group")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<IncidentResponse>> assignIncident(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID assigneeId,
            @RequestParam(required = false) UUID groupId) {
        IncidentResponse response = incidentService.assignIncident(id, assigneeId, groupId);
        return ResponseEntity.ok(ApiResponse.success(response, "Incident assigned successfully"));
    }

    @PatchMapping("/{id}/escalate")
    @Operation(summary = "Escalate incident", description = "Escalates an incident to a higher tier")
    @PreAuthorize("hasAnyRole('ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<IncidentResponse>> escalateIncident(
            @PathVariable UUID id,
            @RequestParam(required = false) String reason,
            @RequestParam(required = false) UUID newAssigneeId) {
        IncidentResponse response = incidentService.escalateIncident(id, reason, newAssigneeId);
        return ResponseEntity.ok(ApiResponse.success(response, "Incident escalated successfully"));
    }

    @PatchMapping("/{id}/resolve")
    @Operation(summary = "Resolve incident", description = "Resolves an incident with resolution details")
    @PreAuthorize("hasAnyRole('ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<IncidentResponse>> resolveIncident(
            @PathVariable UUID id,
            @RequestParam String resolution,
            @RequestParam(required = false) String resolutionCode) {
        IncidentResponse response = incidentService.resolveIncident(id, resolution, resolutionCode);
        return ResponseEntity.ok(ApiResponse.success(response, "Incident resolved successfully"));
    }

    @PatchMapping("/{id}/close")
    @Operation(summary = "Close incident", description = "Closes a resolved incident")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<IncidentResponse>> closeIncident(
            @PathVariable UUID id,
            @RequestParam(required = false) String closureCode) {
        IncidentResponse response = incidentService.closeIncident(id, closureCode);
        return ResponseEntity.ok(ApiResponse.success(response, "Incident closed successfully"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete incident", description = "Soft-deletes an incident")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteIncident(@PathVariable UUID id) {
        incidentService.deleteIncident(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Incident deleted successfully"));
    }
}
