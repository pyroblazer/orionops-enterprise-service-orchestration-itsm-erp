package com.orionops.modules.change.controller;

import com.orionops.common.dto.ApiResponse;
import com.orionops.common.dto.PagedResponse;
import com.orionops.modules.change.dto.ChangeRequestDTO;
import com.orionops.modules.change.dto.ChangeResponse;
import com.orionops.modules.change.entity.ChangeRequest;
import com.orionops.modules.change.service.ChangeService;
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
@RequestMapping("/api/v1/changes")
@RequiredArgsConstructor
@Tag(name = "Changes", description = "Change management operations")
public class ChangeController {

    private final ChangeService changeService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ChangeResponse>> createChange(@Valid @RequestBody ChangeRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(changeService.createChange(request), "Change request created"));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('AGENT', 'ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<ChangeResponse>>> listChanges(
            @RequestParam(required = false) ChangeRequest.ChangeStatus status,
            @RequestParam(required = false) ChangeRequest.ChangeType changeType,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "DESC") String direction) {
        Page<ChangeResponse> result = changeService.listChanges(status, changeType, search, page, size, sort, direction);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(result)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('AGENT', 'ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ChangeResponse>> getChange(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(changeService.getChange(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ChangeResponse>> updateChange(
            @PathVariable UUID id, @Valid @RequestBody ChangeRequestDTO request) {
        return ResponseEntity.ok(ApiResponse.success(changeService.updateChange(id, request), "Change updated"));
    }

    @PatchMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ChangeResponse>> submitChange(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(changeService.submitChange(id), "Change submitted for approval"));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'CHANGE_MANAGER')")
    public ResponseEntity<ApiResponse<ChangeResponse>> approveChange(
            @PathVariable UUID id, @RequestParam UUID approverId) {
        return ResponseEntity.ok(ApiResponse.success(changeService.approveChange(id, approverId), "Change approved"));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'CHANGE_MANAGER')")
    public ResponseEntity<ApiResponse<ChangeResponse>> rejectChange(
            @PathVariable UUID id, @RequestParam String reason) {
        return ResponseEntity.ok(ApiResponse.success(changeService.rejectChange(id, reason), "Change rejected"));
    }

    @PatchMapping("/{id}/implement")
    @PreAuthorize("hasAnyRole('ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ChangeResponse>> implementChange(
            @PathVariable UUID id, @RequestParam(required = false) String notes) {
        return ResponseEntity.ok(ApiResponse.success(changeService.implementChange(id, notes), "Change implementation started"));
    }

    @PatchMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ChangeResponse>> closeChange(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(changeService.closeChange(id), "Change closed"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteChange(@PathVariable UUID id) {
        changeService.deleteChange(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Change deleted"));
    }
}
