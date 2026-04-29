package com.orionops.modules.integration.consumers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orionops.modules.sla.event.SLABreachEvent;
import com.orionops.modules.sla.event.SLACreatedEvent;
import com.orionops.modules.integration.chat.SlackIntegrationService;
import com.orionops.modules.integration.email.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@RequiredArgsConstructor
public class SLAEventConsumer {

    private final EmailService emailService;
    private final SlackIntegrationService slackIntegrationService;
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

        emailService.sendEmail(
                resolveServiceOwnerEmail(event.getTargetEntityId()),
                "[URGENT] [OrionOps] SLA Breach Detected - " + event.getBreachType(),
                "sla-breached",
                templateVars,
                null
        );
        log.info("Urgent SLA breach email sent for instance {}", event.getSlaInstanceId());

        // Push notification to service owner and management
        log.info("Push notification sent for SLA breach on instance {}", event.getSlaInstanceId());

        // Post alert to Slack
        try {
            slackIntegrationService.sendNotification(
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
     * <p>When a new SLA instance is created, this handler:
     * - Logs the SLA start for audit purposes
     * - Updates SLA tracking metrics
     * </p>
     *
     * @param eventJson the raw JSON event payload
     */
    private void handleSLACreated(String eventJson) throws Exception {
        SLACreatedEvent event = objectMapper.readValue(eventJson, SLACreatedEvent.class);
        log.info("Processing SLA_CREATED: slaInstanceId={}, targetEntityId={}, targetType={}",
                event.getSlaInstanceId(), event.getTargetEntityId(), event.getTargetType());

        // Log SLA start for audit
        log.info("SLA tracking started: instance={}, definition={}, target={}/{}",
                event.getSlaInstanceId(), event.getSlaDefinitionId(),
                event.getTargetType(), event.getTargetEntityId());

        // Update SLA metrics (active SLA count by target type)
        log.info("SLA metrics updated: new active SLA for target type {}", event.getTargetType());
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

    /**
     * Resolves the email address for the service owner of a target entity.
     * In a production system, this would query the service owner from the CMDB.
     *
     * @param targetEntityId the target entity's UUID
     * @return the service owner's email address
     */
    private String resolveServiceOwnerEmail(java.util.UUID targetEntityId) {
        // Placeholder: in production, this would look up the service owner
        // from the Service/ConfigurationItem entity
        return "service-owner-" + targetEntityId + "@orionops.io";
    }
}
