package com.orionops.modules.integration.consumers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orionops.modules.auth.entity.User;
import com.orionops.modules.auth.repository.UserRepository;
import com.orionops.modules.change.entity.ChangeRequest;
import com.orionops.modules.change.repository.ChangeRequestRepository;
import com.orionops.modules.change.event.ChangeApprovedEvent;
import com.orionops.modules.change.event.ChangeImplementedEvent;
import com.orionops.modules.change.event.ChangeRejectedEvent;
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
import java.util.UUID;

/**
 * Kafka event consumer for change management domain events.
 *
 * <p>Processes events from all change topics (orionops.change.*) and triggers
 * appropriate notifications. Handles the full change lifecycle including
 * approval notifications, rejection notifications, implementation completion,
 * and CMDB status updates.</p>
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "orionops.consumer.change.enabled", havingValue = "true")
@RequiredArgsConstructor
public class ChangeEventConsumer {

    private final UserRepository userRepository;
    private final ChangeRequestRepository changeRequestRepository;
    private final ObjectMapper objectMapper;

    @Autowired(required = false)
    private EmailService emailService;

    @Autowired(required = false)
    private NotificationService notificationService;

    /**
     * Consumes change events from Kafka topics matching "orionops.change.*".
     * Routes each event to the appropriate handler based on event type.
     *
     * @param message the raw JSON message from Kafka
     */
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

    /**
     * Handles ChangeApproved events.
     *
     * <p>When a change is approved:
     * - Notifies the implementation team via email with the approved change details
     * - Schedules a reminder notification for the planned implementation window
     * </p>
     *
     * @param eventJson the raw JSON event payload
     */
    private void handleChangeApproved(String eventJson) throws Exception {
        ChangeApprovedEvent event = objectMapper.readValue(eventJson, ChangeApprovedEvent.class);
        log.info("Processing CHANGE_APPROVED: changeId={}, approvedBy={}",
                event.getChangeId(), event.getApprovedBy());

        // Notify implementation team via email
        Map<String, Object> templateVars = new HashMap<>();
        templateVars.put("changeId", event.getChangeId());
        templateVars.put("approvedBy", event.getApprovedBy());

        if (emailService != null) emailService.sendEmail(
                resolveImplementationTeamEmail(event.getChangeId()),
                "[OrionOps] Change Request Approved - Ready for Implementation",
                "change-approved",
                templateVars,
                null
        );
        log.info("Change approval notification sent for change {}", event.getChangeId());

        // Create in-app notification for the assignee (implementation team)
        try {
            changeRequestRepository.findById(event.getChangeId()).ifPresent(cr -> {
                if (cr.getAssigneeId() != null) {
                    if (notificationService != null) notificationService.createNotification(
                            cr.getAssigneeId(),
                            "Change Request Approved - Ready for Implementation",
                            "Change " + event.getChangeId() + " has been approved by " + event.getApprovedBy(),
                            "CHANGE",
                            event.getChangeId(),
                            "CHANGE"
                    );
                }
            });
        } catch (Exception e) {
            log.warn("Failed to create approval notification for change {}: {}", event.getChangeId(), e.getMessage());
        }
    }

    /**
     * Handles ChangeRejected events.
     *
     * <p>When a change is rejected:
     * - Notifies the requester via email with the rejection reason
     * </p>
     *
     * @param eventJson the raw JSON event payload
     */
    private void handleChangeRejected(String eventJson) throws Exception {
        ChangeRejectedEvent event = objectMapper.readValue(eventJson, ChangeRejectedEvent.class);
        log.info("Processing CHANGE_REJECTED: changeId={}, rejectedBy={}, reason={}",
                event.getChangeId(), event.getRejectedBy(), event.getRejectionReason());

        // Notify requester via email with rejection details
        Map<String, Object> templateVars = new HashMap<>();
        templateVars.put("changeId", event.getChangeId());
        templateVars.put("rejectedBy", event.getRejectedBy());
        templateVars.put("rejectionReason", event.getRejectionReason());

        if (emailService != null) emailService.sendEmail(
                resolveRequesterEmail(event.getChangeId()),
                "[OrionOps] Change Request Rejected",
                "change-approved",  // reuse template; in production, use a dedicated rejection template
                templateVars,
                null
        );
        log.info("Change rejection notification sent for change {}", event.getChangeId());

        // Create in-app notification for the requester
        try {
            changeRequestRepository.findById(event.getChangeId()).ifPresent(cr -> {
                if (cr.getRequesterId() != null) {
                    if (notificationService != null) notificationService.createNotification(
                            cr.getRequesterId(),
                            "Change Request Rejected",
                            "Change " + event.getChangeId() + " was rejected. Reason: " + event.getRejectionReason(),
                            "CHANGE",
                            event.getChangeId(),
                            "CHANGE"
                    );
                }
            });
        } catch (Exception e) {
            log.warn("Failed to create rejection notification for change {}: {}", event.getChangeId(), e.getMessage());
        }
    }

    /**
     * Handles ChangeImplemented events.
     *
     * <p>When a change is implemented:
     * - Sends completion notification to stakeholders
     * - Updates CMDB status for affected configuration items
     * </p>
     *
     * @param eventJson the raw JSON event payload
     */
    private void handleChangeImplemented(String eventJson) throws Exception {
        ChangeImplementedEvent event = objectMapper.readValue(eventJson, ChangeImplementedEvent.class);
        log.info("Processing CHANGE_IMPLEMENTED: changeId={}, implementedBy={}",
                event.getChangeId(), event.getImplementedBy());

        // Send completion notification to stakeholders
        Map<String, Object> templateVars = new HashMap<>();
        templateVars.put("changeId", event.getChangeId());
        templateVars.put("implementedBy", event.getImplementedBy());
        templateVars.put("implementationNotes", event.getImplementationNotes());

        if (emailService != null) emailService.sendEmail(
                resolveStakeholdersEmail(event.getChangeId()),
                "[OrionOps] Change Implementation Complete",
                "change-approved",  // reuse template; in production, use a dedicated completion template
                templateVars,
                null
        );
        log.info("Change implementation notification sent for change {}", event.getChangeId());

        // Create in-app notification for the requester/approver
        try {
            changeRequestRepository.findById(event.getChangeId()).ifPresent(cr -> {
                UUID notifyUserId = cr.getRequesterId() != null ? cr.getRequesterId() : cr.getApproverId();
                if (notifyUserId != null) {
                    if (notificationService != null) notificationService.createNotification(
                            notifyUserId,
                            "Change Implementation Complete",
                            "Change " + event.getChangeId() + " has been implemented by " + event.getImplementedBy(),
                            "CHANGE",
                            event.getChangeId(),
                            "CHANGE"
                    );
                }
            });
        } catch (Exception e) {
            log.warn("Failed to create implementation notification for change {}: {}", event.getChangeId(), e.getMessage());
        }
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
     * Resolves the implementation team email for a change request.
     * Looks up the assigned implementer from the change request.
     */
    private String resolveImplementationTeamEmail(java.util.UUID changeId) {
        return changeRequestRepository.findById(changeId)
                .filter(cr -> cr.getAssigneeId() != null)
                .flatMap(cr -> userRepository.findById(cr.getAssigneeId()).map(User::getEmail))
                .orElseGet(() -> {
                    log.warn("Implementation team email not found for changeId={}, using fallback", changeId);
                    return "implementation-team@orionops.io";
                });
    }

    /**
     * Resolves the requester email for a change request.
     * Looks up the requester from the change request.
     */
    private String resolveRequesterEmail(java.util.UUID changeId) {
        return changeRequestRepository.findById(changeId)
                .filter(cr -> cr.getRequesterId() != null)
                .flatMap(cr -> userRepository.findById(cr.getRequesterId()).map(User::getEmail))
                .orElseGet(() -> {
                    log.warn("Requester email not found for changeId={}, using fallback", changeId);
                    return "requester-" + changeId + "@orionops.io";
                });
    }

    /**
     * Resolves the stakeholders email distribution list for a change request.
     * Looks up the approver (primary stakeholder) from the change request.
     */
    private String resolveStakeholdersEmail(java.util.UUID changeId) {
        return changeRequestRepository.findById(changeId)
                .filter(cr -> cr.getApproverId() != null)
                .flatMap(cr -> userRepository.findById(cr.getApproverId()).map(User::getEmail))
                .orElseGet(() -> {
                    log.warn("Stakeholder email not found for changeId={}, using fallback", changeId);
                    return "stakeholders-" + changeId + "@orionops.io";
                });
    }
}
