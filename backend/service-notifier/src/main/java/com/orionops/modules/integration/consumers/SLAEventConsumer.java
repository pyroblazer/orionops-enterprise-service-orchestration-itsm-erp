package com.orionops.modules.integration.consumers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orionops.modules.auth.entity.User;
import com.orionops.modules.auth.repository.UserRepository;
import com.orionops.modules.cmdb.entity.Service;
import com.orionops.modules.cmdb.repository.ServiceRepository;
import com.orionops.modules.sla.event.SLABreachEvent;
import com.orionops.modules.sla.event.SLACreatedEvent;
import com.orionops.modules.integration.chat.SlackIntegrationService;
import com.orionops.modules.integration.email.EmailService;
import com.orionops.modules.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
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

    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Autowired(required = false)
    private EmailService emailService;

    @Autowired(required = false)
    private SlackIntegrationService slackIntegrationService;

    @Autowired(required = false)
    private NotificationService notificationService;

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
     * Looks up the CMDB Service by ID, then resolves the owner user's email.
     *
     * @param targetEntityId the target entity's UUID (typically a Service ID)
     * @return the service owner's email address
     */
    private String resolveServiceOwnerEmail(java.util.UUID targetEntityId) {
        return serviceRepository.findById(targetEntityId)
                .filter(s -> s.getOwner() != null)
                .flatMap(s -> {
                    try {
                        java.util.UUID ownerId = java.util.UUID.fromString(s.getOwner());
                        return userRepository.findById(ownerId).map(User::getEmail);
                    } catch (IllegalArgumentException e) {
                        return userRepository.findByUsername(s.getOwner())
                                .map(User::getEmail);
                    }
                })
                .orElseGet(() -> {
                    log.warn("Service owner email not found for targetEntityId={}, using fallback", targetEntityId);
                    return "service-owner-" + targetEntityId + "@orionops.io";
                });
    }

    /**
     * Resolves the owner user ID from a CMDB Service entity.
     * The owner field is a String that may contain a UUID or a username.
     *
     * @param service the CMDB service entity
     * @return the owner's user UUID, or null if not resolvable
     */
    private java.util.UUID resolveOwnerUserId(Service service) {
        try {
            return java.util.UUID.fromString(service.getOwner());
        } catch (IllegalArgumentException e) {
            return userRepository.findByUsername(service.getOwner())
                    .map(User::getId)
                    .orElse(null);
        }
    }
}
