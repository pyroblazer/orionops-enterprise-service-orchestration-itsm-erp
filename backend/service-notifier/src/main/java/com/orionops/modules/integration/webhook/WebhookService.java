package com.orionops.modules.integration.webhook;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.UUID;

@Slf4j
@Service
@ConditionalOnProperty(name = "orionops.webhook.enabled", havingValue = "true")
@RequiredArgsConstructor
public class WebhookService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final int MAX_RETRY_COUNT = 5;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public WebhookRegistration registerWebhook(String endpoint, String[] events, String secret) {
        String webhookId = UUID.randomUUID().toString();
        String webhookSecret = (secret != null && !secret.isBlank()) ? secret : generateSecret();

        log.info("Webhook registered: endpoint={}, webhookId={}, events={}",
                endpoint, webhookId, String.join(",", events));

        return new WebhookRegistration(webhookId, webhookSecret, endpoint);
    }

    public void deliverWebhook(String webhookId, String eventType, Object payload) {
        log.info("Delivering webhook: webhookId={}, eventType={}", webhookId, eventType);
    }

    public void triggerWebhook(String webhookId, java.util.Map<String, ?> payload) {
        log.info("Triggering webhook: webhookId={}", webhookId);
        if (payload == null) {
            log.warn("No payload provided for webhook");
            return;
        }

        try {
            // Send webhook to endpoint
            log.info("Webhook triggered with payload size: {}", payload.size());
        } catch (Exception e) {
            log.error("Failed to trigger webhook: {}", e.getMessage(), e);
        }
    }

    private String generateSecret() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    public static class WebhookRegistration {
        public String webhookId;
        public String secret;
        public String endpoint;

        public WebhookRegistration(String webhookId, String secret, String endpoint) {
            this.webhookId = webhookId;
            this.secret = secret;
            this.endpoint = endpoint;
        }
    }
}
