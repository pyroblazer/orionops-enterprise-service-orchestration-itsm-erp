package com.orionops.modules.audit.controller;

import com.orionops.common.dto.ApiResponse;
import com.orionops.common.dto.PagedResponse;
import com.orionops.modules.audit.dto.AuditResponse;
import com.orionops.modules.audit.service.AuditService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/audit")
@RequiredArgsConstructor
@Tag(name = "Audit", description = "Audit trail operations")
public class AuditController {

    private final AuditService auditService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<PagedResponse<AuditResponse>>> getAuditLogs(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String performedBy,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<AuditResponse> result = auditService.getAuditLogs(entityType, performedBy, startDate, endDate, page, size);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(result)));
    }

    @GetMapping("/entity/{type}/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR', 'MANAGER')")
    public ResponseEntity<ApiResponse<PagedResponse<AuditResponse>>> getEntityAuditTrail(
            @PathVariable("type") String entityType,
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<AuditResponse> result = auditService.getEntityAuditTrail(entityType, id, page, size);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(result)));
    }
}
