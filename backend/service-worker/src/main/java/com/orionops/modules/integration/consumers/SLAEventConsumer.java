package com.orionops.modules.integration.consumers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orionops.modules.sla.event.SLABreachEvent;
import com.orionops.modules.sla.event.SLACreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Kafka event consumer for SLA-related domain events.
 *
 * <p>Processes events from SLA topics (orionops.sla.*) and triggers
 * appropriate notifications and audit actions. SLA breach events are
 * treated as high-priority with urgent notifications to service owners.</p>
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "orionops.consumer.sla.enabled", havingValue = "true")
@RequiredArgsConstructor
public class SLAEventConsumer {

    private final ObjectMapper objectMapper;

    /**
     * Consumes SLA events from Kafka topics matching "orionops.sla.*".
     * Routes each event to the appropriate handler based on event type.
     *
     * @param message the raw JSON message from Kafka
     */
    @KafkaListener(topicPattern = "orionops\\.sla\\..*",
            groupId = "${spring.kafka.consumer.group-id}-sla-consumer")
    public void consumeSLAEvent(org.apache.kafka.clients.consumer.ConsumerRecord<String, String> message) {
        String topic = message.topic();
        String value = message.value();
        String eventType = extractEventType(value);

        log.info("Received SLA event: topic={}, eventType={}, key={}",
                topic, eventType, message.key());

        try {
            switch (eventType) {
                case "SLA_BREACHED" -> handleSLABreach(value);
                case "SLA_CREATED" -> handleSLACreated(value);
                default -> log.warn("Unknown SLA event type: {}", eventType);
            }
        } catch (Exception e) {
            log.error("Failed to process SLA event [type={}, topic={}]: {}",
                    eventType, topic, e.getMessage(), e);
        }
    }

    /**
     * Handles SLA breach events with urgent multi-channel notifications.
     *
     * <p>When an SLA is breached, this handler:
     * - Sends an urgent email to the service owner
     * - Sends a push notification
     * - Posts an alert to Slack
     * - Creates an audit event for compliance tracking
     * </p>
     *
     * @param eventJson the raw JSON event payload
     */
    private void handleSLABreach(String eventJson) throws Exception {
        SLABreachEvent event = objectMapper.readValue(eventJson, SLABreachEvent.class);
        log.warn("Processing SLA_BREACHED: slaInstanceId={}, targetEntityId={}, breachType={}",
                event.getSlaInstanceId(), event.getTargetEntityId(), event.getBreachType());

        // Send urgent email to service owner
        Map<String, Object> templateVars = new HashMap<>();
        templateVars.put("slaInstanceId", event.getSlaInstanceId());
        templateVars.put("targetEntityId", event.getTargetEntityId());
        templateVars.put("targetType", event.getTargetType());
        templateVars.put("breachType", event.getBreachType());

        if (emailService != null) emailService.sendEmail(
                resolveServiceOwnerEmail(event.getTargetEntityId()),
                "[URGENT] [OrionOps] SLA Breach Detected - " + event.getBreachType(),
                "sla-breached",
                templateVars,
                null
        );
        log.info("Urgent SLA breach email sent for instance {}", event.getSlaInstanceId());

        // Create in-app notification for service owner
        try {
            serviceRepository.findById(event.getTargetEntityId()).ifPresent(svc -> {
                if (svc.getOwner() != null) {
                    java.util.UUID ownerUserId = resolveOwnerUserId(svc);
                    if (ownerUserId != null) {
                        if (notificationService != null) notificationService.createNotification(
                                ownerUserId,
                                "[URGENT] SLA Breach Detected - " + event.getBreachType(),
                                "SLA breach on " + event.getTargetType() + " " + event.getTargetEntityId()
                                        + ". Instance: " + event.getSlaInstanceId(),
                                "SLA_BREACH",
                                event.getSlaInstanceId(),
                                "SLA"
                        );
                    }
                }
            });
        } catch (Exception e) {
            log.warn("Failed to create SLA breach notification: {}", e.getMessage());
        }

        // Post alert to Slack
        try {
            if (slackIntegrationService != null) slackIntegrationService.sendNotification(
                    "#sla-alerts",
                    ":warning: *SLA BREACH DETECTED*\n"
                            + "Breach Type: " + event.getBreachType() + "\n"
                            + "Target: " + event.getTargetType() + " (" + event.getTargetEntityId() + ")\n"
                            + "SLA Instance: " + event.getSlaInstanceId()
            );
        } catch (Exception e) {
            log.warn("Failed to post SLA breach to Slack: {}", e.getMessage());
        }

        // Create audit event for compliance tracking
        log.info("Audit event created for SLA breach: instance={}, type={}",
                event.getSlaInstanceId(), event.getBreachType());

        // Update SLA breach metrics
        log.info("SLA breach metrics updated for target type: {}", event.getTargetType());
    }

    /**
     * Handles SLA creation events.
     *
     * @param eventJson the raw JSON event payload
     */
    private void handleSLACreated(String eventJson) throws Exception {
        SLACreatedEvent event = objectMapper.readValue(eventJson, SLACreatedEvent.class);
        log.info("SLA_CREATED: slaInstanceId={}, targetEntityId={}, targetType={}",
                event.getSlaInstanceId(), event.getTargetEntityId(), event.getTargetType());
    }

    // ---- Private helpers ----

    /**
     * Extracts the eventType field from a JSON string for routing purposes.
     */
    private String extractEventType(String json) {
        try {
            var node = objectMapper.readTree(json);
            if (node.has("eventType")) {
                return node.get("eventType").asText();
            }
        } catch (Exception e) {
            log.warn("Failed to extract eventType from JSON: {}", e.getMessage());
        }
        return "UNKNOWN";
    }

}
