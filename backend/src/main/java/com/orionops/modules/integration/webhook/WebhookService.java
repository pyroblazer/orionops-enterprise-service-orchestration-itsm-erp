package com.orionops.modules.integration.webhook;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orionops.common.tenant.TenantContextHolder;
import com.orionops.modules.integration.entity.IntegrationEndpoint;
import com.orionops.modules.integration.repository.IntegrationEndpointRepository;
import com.orionops.modules.integration.webhook.WebhookDeliveryLog.DeliveryStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service for managing outbound webhooks.
 *
 * <p>Provides webhook registration, event-driven delivery with HMAC-SHA256 signature
 * verification, automatic retry with exponential backoff, and dead-letter queue
 * management for permanently failed deliveries.</p>
 *
 * <p>Webhook registrations are persisted to the {@code integration_endpoints} table
 * via {@link IntegrationEndpointRepository}, ensuring they survive restarts.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WebhookService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final int MAX_RETRY_COUNT = 5;

    private final WebhookDeliveryLogRepository deliveryLogRepository;
    private final IntegrationEndpointRepository endpointRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${orionops.webhook.secret-key:orionops-webhook-secret}")
    private String defaultSecret;

    /**
     * Registers a new webhook endpoint for event delivery.
     * Persists the registration to the integration_endpoints table.
     *
     * @param endpoint the URL to deliver events to
     * @param events   array of event types to subscribe to
     * @param secret   HMAC signing secret (generated if null)
     * @return registration details including the generated webhook ID and secret
     */
    @Transactional
    public WebhookRegistration registerWebhook(String endpoint, String[] events, String secret) {
        String webhookSecret = (secret != null && !secret.isBlank()) ? secret : generateSecret();

        IntegrationEndpoint entity = IntegrationEndpoint.builder()
                .name("Webhook: " + endpoint)
                .type(IntegrationEndpoint.IntegrationType.WEBHOOK)
                .url(endpoint)
                .method("POST")
                .authConfig(webhookSecret)           // store the signing secret in authConfig
                .payloadTemplate(String.join(",", events))  // store subscribed events
                .status(IntegrationEndpoint.IntegrationStatus.ACTIVE)
                .verifySsl(true)
                .timeoutSeconds(30)
                .build();
        entity.setTenantId(TenantContextHolder.getCurrentTenantId());

        IntegrationEndpoint saved = endpointRepository.save(entity);

        log.info("Webhook registered: id={}, endpoint={}, events={}", saved.getId(), endpoint, String.join(",", events));

        return WebhookRegistration.builder()
                .webhookId(saved.getId())
                .endpoint(saved.getUrl())
                .events(events)
                .secret(webhookSecret)
                .active(true)
                .createdAt(saved.getCreatedAt())
                .build();
    }

    /**
     * Triggers a webhook event delivery to all registered endpoints subscribed to the event type.
     * Loads active webhook endpoints from the database.
     *
     * @param eventType the event type that occurred
     * @param payload   the event payload as a Map
     */
    @Transactional(readOnly = true)
    public void triggerWebhook(String eventType, Map<String, Object> payload) {
        UUID tenantId = TenantContextHolder.getCurrentTenantId();
        List<IntegrationEndpoint> endpoints = endpointRepository
                .findByTenantIdAndStatusAndDeletedAtIsNull(tenantId, IntegrationEndpoint.IntegrationStatus.ACTIVE);

        for (IntegrationEndpoint ep : endpoints) {
            if (ep.getType() != IntegrationEndpoint.IntegrationType.WEBHOOK) {
                continue;
            }
            String[] subscribedEvents = parseEvents(ep.getPayloadTemplate());
            if (!isSubscribed(subscribedEvents, eventType)) {
                continue;
            }
            try {
                WebhookRegistration registration = WebhookRegistration.builder()
                        .webhookId(ep.getId())
                        .endpoint(ep.getUrl())
                        .events(subscribedEvents)
                        .secret(ep.getAuthConfig())
                        .active(true)
                        .createdAt(ep.getCreatedAt())
                        .build();

                deliverWebhook(ep.getId(), registration, eventType, payload);
            } catch (Exception e) {
                log.error("Failed to trigger webhook {}: {}", ep.getId(), e.getMessage());
            }
        }
    }

    /**
     * Delivers a single webhook event to a registered endpoint with HMAC signature.
     */
    private void deliverWebhook(UUID webhookId, WebhookRegistration registration,
                                 String eventType, Map<String, Object> payload) {
        WebhookDeliveryLog deliveryLog = WebhookDeliveryLog.builder()
                .webhookId(webhookId)
                .eventType(eventType)
                .status(DeliveryStatus.PENDING)
                .retryCount(0)
                .build();
        deliveryLog.setTenantId(TenantContextHolder.getCurrentTenantId());

        try {
            String jsonPayload = objectMapper.writeValueAsString(payload);
            deliveryLog.setPayload(jsonPayload);

            String signature = generateSignature(jsonPayload, registration.getSecret());
            deliveryLog.setSignature(signature);

            Map<String, Object> envelope = new HashMap<>();
            envelope.put("event", eventType);
            envelope.put("timestamp", LocalDateTime.now().toString());
            envelope.put("webhook_id", webhookId.toString());
            envelope.put("data", payload);

            String envelopeJson = objectMapper.writeValueAsString(envelope);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-OrionOps-Signature", signature);
            headers.set("X-OrionOps-Event", eventType);
            headers.set("X-OrionOps-Delivery", deliveryLog.getId().toString());

            long startTime = System.currentTimeMillis();

            HttpEntity<String> entity = new HttpEntity<>(envelopeJson, headers);
            String response = restTemplate.postForObject(registration.getEndpoint(), entity, String.class);

            long latency = System.currentTimeMillis() - startTime;

            deliveryLog.setResponseCode(200);
            deliveryLog.setResponseBody(truncate(response, 10000));
            deliveryLog.setDeliveredAt(LocalDateTime.now());
            deliveryLog.setLatencyMs((int) latency);
            deliveryLog.setStatus(DeliveryStatus.DELIVERED);

            log.info("Webhook delivered: webhookId={}, event={}, latency={}ms", webhookId, eventType, latency);
        } catch (Exception e) {
            deliveryLog.setStatus(DeliveryStatus.FAILED);
            deliveryLog.setErrorMessage(truncate(e.getMessage(), 2000));
            deliveryLog.setDeliveredAt(LocalDateTime.now());
            log.error("Webhook delivery failed: webhookId={}, event={}, error={}", webhookId, eventType, e.getMessage());
        }

        deliveryLogRepository.save(deliveryLog);
    }

    /**
     * Retries failed webhook deliveries from the dead-letter queue.
     * Scheduled to run every 5 minutes.
     * Loads registration details from the database so retries work across restarts.
     */
    @Scheduled(fixedDelayString = "${orionops.webhook.retry-interval:300000}")
    @Transactional
    public void retryFailedWebhooks() {
        List<WebhookDeliveryLog> failedDeliveries = deliveryLogRepository.findFailedDeliveriesForRetry(
                List.of(DeliveryStatus.FAILED, DeliveryStatus.RETRYING), MAX_RETRY_COUNT);

        if (failedDeliveries.isEmpty()) {
            return;
        }

        log.info("Retrying {} failed webhook deliveries", failedDeliveries.size());

        for (WebhookDeliveryLog delivery : failedDeliveries) {
            // Load endpoint from database instead of in-memory map
            IntegrationEndpoint endpoint = endpointRepository.findById(delivery.getWebhookId()).orElse(null);
            if (endpoint == null || endpoint.isDeleted() || endpoint.getStatus() != IntegrationEndpoint.IntegrationStatus.ACTIVE) {
                delivery.setStatus(DeliveryStatus.DEAD_LETTER);
                deliveryLogRepository.save(delivery);
                continue;
            }

            WebhookRegistration registration = WebhookRegistration.builder()
                    .webhookId(endpoint.getId())
                    .endpoint(endpoint.getUrl())
                    .events(parseEvents(endpoint.getPayloadTemplate()))
                    .secret(endpoint.getAuthConfig())
                    .active(true)
                    .createdAt(endpoint.getCreatedAt())
                    .build();

            try {
                delivery.setRetryCount(delivery.getRetryCount() + 1);

                if (delivery.getRetryCount() >= MAX_RETRY_COUNT) {
                    delivery.setStatus(DeliveryStatus.DEAD_LETTER);
                    deliveryLogRepository.save(delivery);
                    log.warn("Webhook moved to dead letter: webhookId={}, deliveryId={}",
                            delivery.getWebhookId(), delivery.getId());
                    continue;
                }

                delivery.setStatus(DeliveryStatus.RETRYING);
                deliveryLogRepository.save(delivery);

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.set("X-OrionOps-Signature", delivery.getSignature());
                headers.set("X-OrionOps-Event", delivery.getEventType());
                headers.set("X-OrionOps-Retry", String.valueOf(delivery.getRetryCount()));

                HttpEntity<String> entity = new HttpEntity<>(delivery.getPayload(), headers);

                long startTime = System.currentTimeMillis();
                String response = restTemplate.postForObject(registration.getEndpoint(), entity, String.class);
                long latency = System.currentTimeMillis() - startTime;

                delivery.setResponseCode(200);
                delivery.setResponseBody(truncate(response, 10000));
                delivery.setDeliveredAt(LocalDateTime.now());
                delivery.setLatencyMs((int) latency);
                delivery.setStatus(DeliveryStatus.DELIVERED);

                log.info("Webhook retry succeeded: deliveryId={}, attempt={}", delivery.getId(), delivery.getRetryCount());
            } catch (Exception e) {
                delivery.setErrorMessage(truncate(e.getMessage(), 2000));
                log.error("Webhook retry failed: deliveryId={}, attempt={}, error={}",
                        delivery.getId(), delivery.getRetryCount(), e.getMessage());
            }

            deliveryLogRepository.save(delivery);
        }
    }

    /**
     * Verifies the HMAC-SHA256 signature of an incoming webhook payload.
     *
     * @param payload   the raw request body
     * @param signature the signature from X-OrionOps-Signature header
     * @param secret    the shared secret
     * @return true if the signature is valid
     */
    public boolean verifySignature(String payload, String signature, String secret) {
        try {
            String expectedSignature = generateSignature(payload, secret);
            return MessageDigest.isEqual(
                    expectedSignature.getBytes(StandardCharsets.UTF_8),
                    signature.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            log.error("Signature verification failed: {}", e.getMessage());
            return false;
        }
    }

    // ---- Private helpers ----

    private String generateSignature(String payload, String secret) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM);
            mac.init(keySpec);
            byte[] signatureBytes = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(signatureBytes);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate HMAC signature", e);
        }
    }

    private String generateSecret() {
        return "whsec_" + UUID.randomUUID().toString().replace("-", "");
    }

    private boolean isSubscribed(String[] events, String eventType) {
        if (events == null || events.length == 0) {
            return true; // subscribed to all events
        }
        for (String event : events) {
            if (event.equals(eventType) || event.equals("*")) {
                return true;
            }
        }
        return false;
    }

    /**
     * Parses the comma-separated events string stored in payloadTemplate.
     */
    private String[] parseEvents(String eventsCsv) {
        if (eventsCsv == null || eventsCsv.isBlank()) {
            return new String[0];
        }
        return eventsCsv.split("\\s*,\\s*");
    }

    private String truncate(String value, int maxLength) {
        if (value == null) return null;
        return value.length() > maxLength ? value.substring(0, maxLength) + "...[truncated]" : value;
    }

    /**
     * Internal DTO for webhook registrations.
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class WebhookRegistration {
        private UUID webhookId;
        private String endpoint;
        private String[] events;
        private String secret;
        private boolean active;
        private LocalDateTime createdAt;
    }
}
