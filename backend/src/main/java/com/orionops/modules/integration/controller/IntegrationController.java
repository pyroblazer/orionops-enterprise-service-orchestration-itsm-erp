package com.orionops.modules.integration.controller;

import com.orionops.common.dto.ApiResponse;
import com.orionops.modules.integration.dto.IntegrationRequest;
import com.orionops.modules.integration.dto.IntegrationResponse;
import com.orionops.modules.integration.service.IntegrationService;
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
@RequestMapping("/api/v1/integrations")
@RequiredArgsConstructor
@Tag(name = "Integrations", description = "Integration endpoint management")
public class IntegrationController {

    private final IntegrationService integrationService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<ApiResponse<IntegrationResponse>> createEndpoint(@Valid @RequestBody IntegrationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(integrationService.createEndpoint(request), "Integration endpoint created"));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<IntegrationResponse>>> listEndpoints() {
        return ResponseEntity.ok(ApiResponse.success(integrationService.listEndpoints()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<IntegrationResponse>> getEndpoint(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(integrationService.getEndpoint(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<IntegrationResponse>> updateEndpoint(
            @PathVariable UUID id, @Valid @RequestBody IntegrationRequest request) {
        return ResponseEntity.ok(ApiResponse.success(integrationService.updateEndpoint(id, request), "Integration endpoint updated"));
    }

    @PostMapping("/{id}/test")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testEndpoint(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(integrationService.testEndpoint(id), "Endpoint test completed"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteEndpoint(@PathVariable UUID id) {
        integrationService.deleteEndpoint(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Integration endpoint deleted"));
    }
}
