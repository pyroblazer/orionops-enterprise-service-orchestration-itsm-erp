package com.orionops.modules.tenant.controller;

import com.orionops.common.dto.ApiResponse;
import com.orionops.modules.tenant.dto.TenantDTO;
import com.orionops.modules.tenant.service.TenantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tenants")
@RequiredArgsConstructor
@Tag(name = "Tenants", description = "Multi-tenant management")
public class TenantController {

    private final TenantService tenantService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TenantDTO.TenantResponse>> provisionTenant(@Valid @RequestBody TenantDTO.CreateTenantRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(tenantService.provisionTenant(request), "Tenant provisioned"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TenantDTO.TenantResponse>> getTenant(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(tenantService.getTenant(id)));
    }

    @GetMapping
    @Operation(summary = "List tenants", description = "Lists all tenants")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<TenantDTO.TenantResponse>>> listTenants() {
        return ResponseEntity.ok(ApiResponse.success(tenantService.listTenants()));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update tenant", description = "Updates an existing tenant")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TenantDTO.TenantResponse>> updateTenant(
            @PathVariable UUID id, @Valid @RequestBody TenantDTO.CreateTenantRequest request) {
        return ResponseEntity.ok(ApiResponse.success(tenantService.updateTenant(id, request), "Tenant updated"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete tenant", description = "Soft-deletes a tenant")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteTenant(@PathVariable UUID id) {
        tenantService.deleteTenant(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Tenant deleted"));
    }

    @GetMapping("/{id}/subscription")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<TenantDTO.SubscriptionResponse>> getSubscription(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(tenantService.getSubscription(id)));
    }

    @PostMapping("/webhook/stripe")
    public ResponseEntity<ApiResponse<Void>> stripeWebhook(@RequestBody Map<String, Object> payload) {
        tenantService.handleStripeWebhook(payload);
        return ResponseEntity.ok(ApiResponse.success(null, "Webhook processed"));
    }
}
