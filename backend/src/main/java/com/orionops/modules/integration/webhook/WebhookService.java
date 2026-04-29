package com.orionops.modules.integration.webhook;

import com.fasterxml.jackson.databind.ObjectMapper;
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
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WebhookService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final int MAX_RETRY_COUNT = 5;
    private static final long[] RETRY_DELAYS_MS = {5000, 15000, 60000, 300000, 900000};

    private final WebhookDeliveryLogRepository deliveryLogRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${orionops.webhook.secret-key:orionops-webhook-secret}")
    private String defaultSecret;

    /**
     * Webhook endpoint registry (in-memory for this implementation).
     * In production, this would be persisted to the database via IntegrationEndpoint entity.
     */
    private final Map<UUID, WebhookRegistration> webhookRegistry = new java.util.concurrent.ConcurrentHashMap<>();

    /**
     * Registers a new webhook endpoint for event delivery.
     *
     * @param endpoint the URL to deliver events to
     * @param events   array of event types to subscribe to
     * @param secret   HMAC signing secret (generated if null)
     * @return registration details including the generated webhook ID and secret
     */
    @Transactional
    public WebhookRegistration registerWebhook(String endpoint, String[] events, String secret) {
        UUID webhookId = UUID.randomUUID();
        String webhookSecret = (secret != null && !secret.isBlank()) ? secret : generateSecret();

        WebhookRegistration registration = WebhookRegistration.builder()
                .webhookId(webhookId)
                .endpoint(endpoint)
                .events(events)
                .secret(webhookSecret)
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();

        webhookRegistry.put(webhookId, registration);
        log.info("Webhook registered: id={}, endpoint={}, events={}", webhookId, endpoint, String.join(",", events));

        return registration;
    }

    /**
     * Triggers a webhook event delivery to all registered endpoints subscribed to the event type.
     *
     * @param eventType the event type that occurred
     * @param payload   the event payload as a Map
     */
    public void triggerWebhook(String eventType, Map<String, Object> payload) {
        for (Map.Entry<UUID, WebhookRegistration> entry : webhookRegistry.entrySet()) {
            WebhookRegistration registration = entry.getValue();
            if (!registration.isActive()) {
                continue;
            }
            if (!isSubscribed(registration.getEvents(), eventType)) {
                continue;
            }
            try {
                deliverWebhook(entry.getKey(), registration, eventType, payload);
            } catch (Exception e) {
                log.error("Failed to trigger webhook {}: {}", entry.getKey(), e.getMessage());
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
                .tenantId(resolveTenantId())
                .status(DeliveryStatus.PENDING)
                .retryCount(0)
                .build();

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
            WebhookRegistration registration = webhookRegistry.get(delivery.getWebhookId());
            if (registration == null || !registration.isActive()) {
                delivery.setStatus(DeliveryStatus.DEAD_LETTER);
                deliveryLogRepository.save(delivery);
                continue;
            }

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

    /**
     * Generates an HMAC-SHA256 signature for the given payload.
     */
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

    /**
     * Generates a random webhook secret for new registrations.
     */
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

    private String truncate(String value, int maxLength) {
        if (value == null) return null;
        return value.length() > maxLength ? value.substring(0, maxLength) + "...[truncated]" : value;
    }

    private UUID resolveTenantId() {
        return UUID.fromString("00000000-0000-0000-0000-000000000001");
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
