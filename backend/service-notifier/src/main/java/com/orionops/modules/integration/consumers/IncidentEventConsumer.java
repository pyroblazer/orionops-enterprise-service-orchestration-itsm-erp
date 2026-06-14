package com.orionops.modules.integration.consumers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orionops.common.event.IncidentEventPayload;
import com.orionops.modules.integration.chat.SlackIntegrationService;
import com.orionops.modules.integration.email.EmailService;
import com.orionops.modules.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@ConditionalOnProperty(name = "orionops.consumer.incident.enabled", havingValue = "true")
@RequiredArgsConstructor
public class IncidentEventConsumer {

    private final ObjectMapper objectMapper;

    @Autowired(required = false)
    private EmailService emailService;

    @Autowired(required = false)
    private SlackIntegrationService slackIntegrationService;

    @Autowired(required = false)
    private NotificationService notificationService;

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
        }
    }

    private void handleIncidentCreated(String eventJson) throws Exception {
        IncidentEventPayload event = objectMapper.readValue(eventJson, IncidentEventPayload.class);
        log.info("Processing INCIDENT_CREATED: incidentId={}, title={}", event.getIncidentId(), event.getTitle());

        // Send email to assignee if one is assigned
        if (event.getAssigneeId() != null && emailService != null) {
            Map<String, Object> templateVars = new HashMap<>();
            templateVars.put("incidentId", event.getIncidentId());
            templateVars.put("title", event.getTitle());
            templateVars.put("priority", event.getPriority());
            templateVars.put("category", event.getCategory());
            templateVars.put("reporterId", event.getReporterId());

            emailService.sendEmail(
                    "assignee-" + event.getAssigneeId() + "@orionops.io",
                    "[OrionOps] New Incident Assigned: " + event.getTitle(),
                    "incident-created",
                    templateVars,
                    null
            );
            log.info("Incident creation email sent to assignee: {}", event.getAssigneeId());
        }

        // Create in-app notification for the assignee
        if (event.getAssigneeId() != null && notificationService != null) {
            try {
                notificationService.createNotification(
                        event.getAssigneeId(),
                        "New Incident Assigned: " + event.getTitle(),
                        "Incident " + event.getIncidentId() + " has been assigned to you. Priority: " + event.getPriority(),
                        "INCIDENT",
                        event.getIncidentId(),
                        "INCIDENT"
                );
            } catch (Exception e) {
                log.warn("Failed to create in-app notification for incident {}: {}", event.getIncidentId(), e.getMessage());
            }
        }
    }

    private void handleIncidentAssigned(String eventJson) throws Exception {
        IncidentEventPayload event = objectMapper.readValue(eventJson, IncidentEventPayload.class);
        log.info("Processing INCIDENT_ASSIGNED: incidentId={}, assigneeId={}",
                event.getIncidentId(), event.getAssigneeId());

        // Send email to the new assignee
        if (event.getAssigneeId() != null && emailService != null) {
            Map<String, Object> templateVars = new HashMap<>();
            templateVars.put("incidentId", event.getIncidentId());
            templateVars.put("assigneeId", event.getAssigneeId());

            emailService.sendEmail(
                    "assignee-" + event.getAssigneeId() + "@orionops.io",
                    "[OrionOps] Incident Assigned to You",
                    "incident-assigned",
                    templateVars,
                    null
            );
            log.info("Assignment email sent to new assignee: {}", event.getAssigneeId());
        }

        // Create in-app notification for the assignee
        if (event.getAssigneeId() != null && notificationService != null) {
            try {
                notificationService.createNotification(
                        event.getAssigneeId(),
                        "Incident Assigned to You",
                        "Incident " + event.getIncidentId() + " has been assigned to you.",
                        "INCIDENT",
                        event.getIncidentId(),
                        "INCIDENT"
                );
            } catch (Exception e) {
                log.warn("Failed to create assignment notification for user {}: {}", event.getAssigneeId(), e.getMessage());
            }
        }
    }

    private void handleIncidentEscalated(String eventJson) throws Exception {
        IncidentEventPayload event = objectMapper.readValue(eventJson, IncidentEventPayload.class);
        log.info("Processing INCIDENT_ESCALATED: incidentId={}, level={}, reason={}",
                event.getIncidentId(), event.getEscalationLevel(), event.getEscalationReason());

        // Post to Slack for team visibility
        if (slackIntegrationService != null) {
            try {
                slackIntegrationService.sendNotification(
                        "#incidents",
                        ":rotating_light: *INCIDENT ESCALATED* (Level " + event.getEscalationLevel() + ")\n"
                                + "Incident ID: " + event.getIncidentId() + "\n"
                                + "Reason: " + event.getEscalationReason()
                );
            } catch (Exception e) {
                log.warn("Failed to post escalation to Slack: {}", e.getMessage());
            }
        }

        // Create in-app notification for the escalation
        if (event.getNewAssigneeId() != null && notificationService != null) {
            try {
                notificationService.createNotification(
                        event.getNewAssigneeId(),
                        "[URGENT] Incident Escalated to Level " + event.getEscalationLevel(),
                        "Incident " + event.getIncidentId() + " has been escalated. Reason: " + event.getEscalationReason(),
                        "INCIDENT_ESCALATION",
                        event.getIncidentId(),
                        "INCIDENT"
                );
            } catch (Exception e) {
                log.warn("Failed to create escalation notification: {}", e.getMessage());
            }
        }
    }

    private void handleIncidentResolved(String eventJson) throws Exception {
        IncidentEventPayload event = objectMapper.readValue(eventJson, IncidentEventPayload.class);
        log.info("Processing INCIDENT_RESOLVED: incidentId={}, resolvedBy={}",
                event.getIncidentId(), event.getResolvedBy());

        // Notify about resolution
        if (event.getResolvedBy() != null && notificationService != null) {
            try {
                notificationService.createNotification(
                        event.getResolvedBy(),
                        "Incident Resolved: " + event.getIncidentId(),
                        "Incident " + event.getIncidentId() + " has been resolved. Resolution: " + event.getResolution(),
                        "INCIDENT_RESOLVED",
                        event.getIncidentId(),
                        "INCIDENT"
                );
            } catch (Exception e) {
                log.warn("Failed to create resolution notification: {}", e.getMessage());
            }
        }
    }

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
