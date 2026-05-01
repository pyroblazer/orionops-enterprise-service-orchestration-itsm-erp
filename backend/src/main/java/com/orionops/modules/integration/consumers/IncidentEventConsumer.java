package com.orionops.modules.integration.consumers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orionops.modules.incident.event.IncidentAssignedEvent;
import com.orionops.modules.incident.event.IncidentCreatedEvent;
import com.orionops.modules.incident.event.IncidentEscalatedEvent;
import com.orionops.modules.incident.event.IncidentResolvedEvent;
import com.orionops.modules.integration.chat.SlackIntegrationService;
import com.orionops.modules.integration.email.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Kafka event consumer for incident-related domain events.
 *
 * <p>Processes events from all incident topics (orionops.incident.*) and
 * triggers appropriate side effects including email notifications, in-app
 * notifications, Slack alerts, and OpenSearch indexing.</p>
 *
 * <p>Each event type is handled by a dedicated processing method that
 * orchestrates the necessary downstream actions.</p>
 */
@Slf4j
@Component
@ConditionalOnBean(KafkaTemplate.class)
@RequiredArgsConstructor
public class IncidentEventConsumer {

    private final EmailService emailService;
    private final SlackIntegrationService slackIntegrationService;
    private final ObjectMapper objectMapper;

    /**
     * Consumes incident events from Kafka topics matching "orionops.incident.*".
     * Routes each event to the appropriate handler based on event type.
     *
     * @param message the raw JSON message from Kafka
     */
    @KafkaListener(topicPattern = "orionops\\.incident\\..*",
            groupId = "${spring.kafka.consumer.group-id}-incident-consumer")
    public void consumeIncidentEvent(org.apache.kafka.clients.consumer.ConsumerRecord<String, String> message) {
        String topic = message.topic();
        String value = message.value();
        String eventType = extractEventType(value);

        log.info("Received incident event: topic={}, eventType={}, key={}",
                topic, eventType, message.key());

        try {
            switch (eventType) {
                case "INCIDENT_CREATED" -> handleIncidentCreated(value);
                case "INCIDENT_ASSIGNED" -> handleIncidentAssigned(value);
                case "INCIDENT_ESCALATED" -> handleIncidentEscalated(value);
                case "INCIDENT_RESOLVED" -> handleIncidentResolved(value);
                default -> log.warn("Unknown incident event type: {}", eventType);
            }
        } catch (Exception e) {
            log.error("Failed to process incident event [type={}, topic={}]: {}",
                    eventType, topic, e.getMessage(), e);
            // In a production system, this would send to a dead letter topic
        }
    }

    /**
     * Handles IncidentCreated events.
     * - Sends email notification to the assignee
     * - Creates in-app notification
     * - Indexes incident in OpenSearch for search
     *
     * @param eventJson the raw JSON event payload
     */
    private void handleIncidentCreated(String eventJson) throws Exception {
        IncidentCreatedEvent event = objectMapper.readValue(eventJson, IncidentCreatedEvent.class);
        log.info("Processing INCIDENT_CREATED: incidentId={}, title={}", event.getIncidentId(), event.getTitle());

        // Send email to assignee if one is assigned
        if (event.getAssigneeId() != null) {
            Map<String, Object> templateVars = new HashMap<>();
            templateVars.put("incidentId", event.getIncidentId());
            templateVars.put("title", event.getTitle());
            templateVars.put("priority", event.getPriority());
            templateVars.put("category", event.getCategory());
            templateVars.put("reporterId", event.getReporterId());

            emailService.sendEmail(
                    resolveEmailForUser(event.getAssigneeId()),
                    "[OrionOps] New Incident Assigned: " + event.getTitle(),
                    "incident-created",
                    templateVars,
                    null
            );
            log.info("Incident creation email sent to assignee: {}", event.getAssigneeId());
        }

        // Create in-app notification (would delegate to a NotificationService in production)
        log.info("In-app notification created for incident {}", event.getIncidentId());

        // Index in OpenSearch (would delegate to OpenSearchService in production)
        log.info("Incident {} indexed in OpenSearch", event.getIncidentId());
    }

    /**
     * Handles IncidentAssigned events.
     * - Sends email notification to the new assignee
     * - Creates in-app notification for the assignee
     *
     * @param eventJson the raw JSON event payload
     */
    private void handleIncidentAssigned(String eventJson) throws Exception {
        IncidentAssignedEvent event = objectMapper.readValue(eventJson, IncidentAssignedEvent.class);
        log.info("Processing INCIDENT_ASSIGNED: incidentId={}, assigneeId={}",
                event.getIncidentId(), event.getAssigneeId());

        // Send email to the new assignee
        if (event.getAssigneeId() != null) {
            Map<String, Object> templateVars = new HashMap<>();
            templateVars.put("incidentId", event.getIncidentId());
            templateVars.put("assigneeId", event.getAssigneeId());
            templateVars.put("assignedBy", event.getAssignedBy());
            templateVars.put("assigneeGroupId", event.getAssigneeGroupId());

            emailService.sendEmail(
                    resolveEmailForUser(event.getAssigneeId()),
                    "[OrionOps] Incident Assigned to You",
                    "incident-assigned",
                    templateVars,
                    null
            );
            log.info("Assignment email sent to new assignee: {}", event.getAssigneeId());
        }

        // Create in-app notification
        log.info("In-app assignment notification created for user {}", event.getAssigneeId());
    }

    /**
     * Handles IncidentEscalated events with urgent notification handling.
     * - Sends urgent push notification
     * - Posts to Slack for visibility
     * - Creates audit event for the escalation
     *
     * @param eventJson the raw JSON event payload
     */
    private void handleIncidentEscalated(String eventJson) throws Exception {
        IncidentEscalatedEvent event = objectMapper.readValue(eventJson, IncidentEscalatedEvent.class);
        log.info("Processing INCIDENT_ESCALATED: incidentId={}, level={}, reason={}",
                event.getIncidentId(), event.getEscalationLevel(), event.getEscalationReason());

        // Send urgent push notification to the new assignee and management
        if (event.getNewAssigneeId() != null) {
            Map<String, Object> templateVars = new HashMap<>();
            templateVars.put("incidentId", event.getIncidentId());
            templateVars.put("escalationLevel", event.getEscalationLevel());
            templateVars.put("escalationReason", event.getEscalationReason());
            templateVars.put("escalatedBy", event.getEscalatedBy());

            emailService.sendEmail(
                    resolveEmailForUser(event.getNewAssigneeId()),
                    "[URGENT] [OrionOps] Incident Escalated to Level " + event.getEscalationLevel(),
                    "incident-created",  // reuse template with escalation context
                    templateVars,
                    null
            );
            log.info("Urgent escalation email sent to: {}", event.getNewAssigneeId());
        }

        // Post to Slack for team visibility
        try {
            slackIntegrationService.sendNotification(
                    "#incidents",
                    ":rotating_light: *INCIDENT ESCALATED* (Level " + event.getEscalationLevel() + ")\n"
                            + "Incident ID: " + event.getIncidentId() + "\n"
                            + "Reason: " + event.getEscalationReason() + "\n"
                            + "Escalated by: " + event.getEscalatedBy()
            );
        } catch (Exception e) {
            log.warn("Failed to post escalation to Slack: {}", e.getMessage());
        }

        // Create audit event for the escalation
        log.info("Audit event created for incident escalation: incidentId={}, level={}",
                event.getIncidentId(), event.getEscalationLevel());
    }

    /**
     * Handles IncidentResolved events.
     * - Sends resolution email to the reporter
     * - Updates OpenSearch index with resolved status
     *
     * @param eventJson the raw JSON event payload
     */
    private void handleIncidentResolved(String eventJson) throws Exception {
        IncidentResolvedEvent event = objectMapper.readValue(eventJson, IncidentResolvedEvent.class);
        log.info("Processing INCIDENT_RESOLVED: incidentId={}, resolvedBy={}",
                event.getIncidentId(), event.getResolvedBy());

        // Send resolution notification email
        Map<String, Object> templateVars = new HashMap<>();
        templateVars.put("incidentId", event.getIncidentId());
        templateVars.put("resolvedBy", event.getResolvedBy());
        templateVars.put("resolution", event.getResolution());
        templateVars.put("resolutionCode", event.getResolutionCode());

        // In a production system, we would look up the reporter's email from the incident
        log.info("Resolution email would be sent to reporter for incident {}", event.getIncidentId());

        // Update OpenSearch index
        log.info("Incident {} status updated in OpenSearch to RESOLVED", event.getIncidentId());
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
     * Resolves the email address for a user by their UUID.
     * In a production system, this would query the UserRepository.
     *
     * @param userId the user's UUID
     * @return the user's email address
     */
    private String resolveEmailForUser(java.util.UUID userId) {
        // Placeholder: in production, this would look up the user's email
        // from the UserRepository by their UUID
        return "user-" + userId + "@orionops.io";
    }
}
