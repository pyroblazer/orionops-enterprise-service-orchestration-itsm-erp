package com.orionops.modules.integration.consumers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orionops.common.event.ChangeEventPayload;
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
@ConditionalOnProperty(name = "orionops.consumer.change.enabled", havingValue = "true")
@RequiredArgsConstructor
public class ChangeEventConsumer {

    private final ObjectMapper objectMapper;

    @Autowired(required = false)
    private EmailService emailService;

    @Autowired(required = false)
    private NotificationService notificationService;

    @KafkaListener(topicPattern = "orionops\\.change\\..*",
            groupId = "${spring.kafka.consumer.group-id}-change-consumer")
    public void consumeChangeEvent(org.apache.kafka.clients.consumer.ConsumerRecord<String, String> message) {
        String topic = message.topic();
        String value = message.value();
        String eventType = extractEventType(value);

        log.info("Received change event: topic={}, eventType={}, key={}",
                topic, eventType, message.key());

        try {
            switch (eventType) {
                case "CHANGE_APPROVED" -> handleChangeApproved(value);
                case "CHANGE_REJECTED" -> handleChangeRejected(value);
                case "CHANGE_IMPLEMENTED" -> handleChangeImplemented(value);
                default -> log.warn("Unknown change event type: {}", eventType);
            }
        } catch (Exception e) {
            log.error("Failed to process change event [type={}, topic={}]: {}",
                    eventType, topic, e.getMessage(), e);
        }
    }

    private void handleChangeApproved(String eventJson) throws Exception {
        ChangeEventPayload event = objectMapper.readValue(eventJson, ChangeEventPayload.class);
        log.info("Processing CHANGE_APPROVED: changeId={}, approvedBy={}",
                event.getChangeId(), event.getApprovedBy());

        // Notify implementation team via email
        if (emailService != null) {
            Map<String, Object> templateVars = new HashMap<>();
            templateVars.put("changeId", event.getChangeId());
            templateVars.put("approvedBy", event.getApprovedBy());

            emailService.sendEmail(
                    "implementation-team@orionops.io",
                    "[OrionOps] Change Request Approved - Ready for Implementation",
                    "change-approved",
                    templateVars,
                    null
            );
            log.info("Change approval notification sent for change {}", event.getChangeId());
        }

        // Create in-app notification for the assignee
        if (event.getAssigneeId() != null && notificationService != null) {
            try {
                notificationService.createNotification(
                        event.getAssigneeId(),
                        "Change Request Approved - Ready for Implementation",
                        "Change " + event.getChangeId() + " has been approved by " + event.getApprovedBy(),
                        "CHANGE",
                        event.getChangeId(),
                        "CHANGE"
                );
            } catch (Exception e) {
                log.warn("Failed to create approval notification for change {}: {}", event.getChangeId(), e.getMessage());
            }
        }
    }

    private void handleChangeRejected(String eventJson) throws Exception {
        ChangeEventPayload event = objectMapper.readValue(eventJson, ChangeEventPayload.class);
        log.info("Processing CHANGE_REJECTED: changeId={}, rejectedBy={}, reason={}",
                event.getChangeId(), event.getRejectedBy(), event.getRejectionReason());

        // Notify requester via email
        if (emailService != null) {
            Map<String, Object> templateVars = new HashMap<>();
            templateVars.put("changeId", event.getChangeId());
            templateVars.put("rejectedBy", event.getRejectedBy());
            templateVars.put("rejectionReason", event.getRejectionReason());

            emailService.sendEmail(
                    "requester-" + event.getChangeId() + "@orionops.io",
                    "[OrionOps] Change Request Rejected",
                    "change-rejected",
                    templateVars,
                    null
            );
            log.info("Change rejection notification sent for change {}", event.getChangeId());
        }

        // Create in-app notification for the requester
        if (event.getRequesterId() != null && notificationService != null) {
            try {
                notificationService.createNotification(
                        event.getRequesterId(),
                        "Change Request Rejected",
                        "Change " + event.getChangeId() + " was rejected. Reason: " + event.getRejectionReason(),
                        "CHANGE",
                        event.getChangeId(),
                        "CHANGE"
                );
            } catch (Exception e) {
                log.warn("Failed to create rejection notification for change {}: {}", event.getChangeId(), e.getMessage());
            }
        }
    }

    private void handleChangeImplemented(String eventJson) throws Exception {
        ChangeEventPayload event = objectMapper.readValue(eventJson, ChangeEventPayload.class);
        log.info("Processing CHANGE_IMPLEMENTED: changeId={}, implementedBy={}",
                event.getChangeId(), event.getImplementedBy());

        // Send completion notification to stakeholders
        if (emailService != null) {
            Map<String, Object> templateVars = new HashMap<>();
            templateVars.put("changeId", event.getChangeId());
            templateVars.put("implementedBy", event.getImplementedBy());
            templateVars.put("implementationNotes", event.getImplementationNotes());

            emailService.sendEmail(
                    "stakeholders-" + event.getChangeId() + "@orionops.io",
                    "[OrionOps] Change Implementation Complete",
                    "change-implemented",
                    templateVars,
                    null
            );
            log.info("Change implementation notification sent for change {}", event.getChangeId());
        }

        // Create in-app notification for requester/approver
        if (notificationService != null) {
            try {
                java.util.UUID notifyUserId = event.getRequesterId() != null ? event.getRequesterId() : event.getApproverId();
                if (notifyUserId != null) {
                    notificationService.createNotification(
                            notifyUserId,
                            "Change Implementation Complete",
                            "Change " + event.getChangeId() + " has been implemented by " + event.getImplementedBy(),
                            "CHANGE",
                            event.getChangeId(),
                            "CHANGE"
                    );
                }
            } catch (Exception e) {
                log.warn("Failed to create implementation notification for change {}: {}", event.getChangeId(), e.getMessage());
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
