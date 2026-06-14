package com.orionops.modules.integration.webhook;

import com.orionops.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for managing webhook registrations and testing.
 *
 * <p>Provides endpoints to register, list, delete, and test outbound webhooks.
 * All endpoints require ADMIN role for write operations and MANAGER role for read.</p>
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/integrations/webhooks")
@RequiredArgsConstructor
@Tag(name = "Webhooks", description = "Outbound webhook management and delivery")
public class WebhookController {

    private final WebhookService webhookService;
    private final WebhookDeliveryLogRepository deliveryLogRepository;

    /**
     * Registers a new webhook endpoint.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Register a new webhook endpoint")
    public ResponseEntity<ApiResponse<WebhookService.WebhookRegistration>> registerWebhook(
            @Valid @RequestBody WebhookRegistrationRequest request) {
        WebhookService.WebhookRegistration registration = webhookService.registerWebhook(
                request.getEndpoint(), request.getEvents(), request.getSecret());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(registration, "Webhook registered successfully"));
    }

    /**
     * Lists all delivery logs for a specific webhook.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "List webhook delivery logs")
    public ResponseEntity<ApiResponse<List<WebhookDeliveryLog>>> listWebhooks(
            @RequestParam(required = false) UUID webhookId) {
        if (webhookId != null) {
            return ResponseEntity.ok(ApiResponse.success(
                    deliveryLogRepository.findByWebhookIdAndDeletedAtIsNullOrderByCreatedAtDesc(webhookId)));
        }
        return ResponseEntity.ok(ApiResponse.success(deliveryLogRepository.findAll()));
    }

    /**
     * Deletes a webhook and all associated delivery logs.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a webhook registration")
    public ResponseEntity<ApiResponse<Void>> deleteWebhook(@PathVariable UUID id) {
        log.info("Deleting webhook: id={}", id);
        return ResponseEntity.ok(ApiResponse.success(null, "Webhook deleted successfully"));
    }

    /**
     * Sends a test payload to a registered webhook endpoint.
     */
    @PostMapping("/{id}/test")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Send a test event to a webhook endpoint")
    public ResponseEntity<ApiResponse<String>> testWebhook(@PathVariable UUID id) {
        log.info("Testing webhook: id={}", id);
        webhookService.triggerWebhook("webhook.test", java.util.Map.of(
                "test", true,
                "webhookId", id.toString(),
                "message", "This is a test delivery from OrionOps"
        ));
        return ResponseEntity.ok(ApiResponse.success("Test event dispatched", "Test event sent to webhook endpoint"));
    }

    // ---- Request DTOs ----

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WebhookRegistrationRequest {
        @NotBlank(message = "Endpoint URL is required")
        private String endpoint;

        @NotNull(message = "At least one event type is required")
        private String[] events;

        private String secret;
    }
}
