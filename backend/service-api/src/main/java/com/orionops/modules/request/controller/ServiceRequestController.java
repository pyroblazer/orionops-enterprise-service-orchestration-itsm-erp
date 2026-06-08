package com.orionops.modules.request.controller;

import com.orionops.common.dto.ApiResponse;
import com.orionops.common.dto.PagedResponse;
import com.orionops.modules.request.dto.ServiceRequestDTO;
import com.orionops.modules.request.dto.ServiceRequestResponse;
import com.orionops.modules.request.entity.ServiceRequest;
import com.orionops.modules.request.service.ServiceRequestService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/requests")
@RequiredArgsConstructor
@Tag(name = "Service Requests", description = "Service request management")
public class ServiceRequestController {

    private final ServiceRequestService requestService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ServiceRequestResponse>> createRequest(@Valid @RequestBody ServiceRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(requestService.createRequest(request), "Service request created"));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('AGENT', 'ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<ServiceRequestResponse>>> listRequests(
            @RequestParam(required = false) ServiceRequest.RequestStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "DESC") String direction) {
        Page<ServiceRequestResponse> result = requestService.listRequests(status, search, page, size, sort, direction);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(result)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('AGENT', 'ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ServiceRequestResponse>> getRequest(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(requestService.getRequest(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('AGENT', 'ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ServiceRequestResponse>> updateRequest(
            @PathVariable UUID id, @Valid @RequestBody ServiceRequestDTO request) {
        return ResponseEntity.ok(ApiResponse.success(requestService.updateRequest(id, request), "Request updated"));
    }

    @PatchMapping("/{id}/submit")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ServiceRequestResponse>> submitRequest(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(requestService.submitRequest(id), "Request submitted"));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ServiceRequestResponse>> approveRequest(
            @PathVariable UUID id, @RequestParam UUID approverId) {
        return ResponseEntity.ok(ApiResponse.success(requestService.approveRequest(id, approverId), "Request approved"));
    }

    @PatchMapping("/{id}/fulfill")
    @PreAuthorize("hasAnyRole('ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ServiceRequestResponse>> fulfillRequest(
            @PathVariable UUID id, @RequestParam(required = false) String notes) {
        return ResponseEntity.ok(ApiResponse.success(requestService.fulfillRequest(id, notes), "Request fulfilled"));
    }

    @PatchMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ServiceRequestResponse>> closeRequest(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(requestService.closeRequest(id), "Request closed"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteRequest(@PathVariable UUID id) {
        requestService.deleteRequest(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Request deleted"));
    }
}
