package com.orionops.modules.integration.consumers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orionops.modules.auth.entity.User;
import com.orionops.modules.auth.repository.UserRepository;
import com.orionops.modules.incident.event.IncidentAssignedEvent;
import com.orionops.modules.incident.event.IncidentCreatedEvent;
import com.orionops.modules.incident.event.IncidentEscalatedEvent;
import com.orionops.modules.incident.event.IncidentResolvedEvent;
import com.orionops.modules.integration.chat.SlackIntegrationService;
import com.orionops.modules.integration.email.EmailService;
import com.orionops.modules.notification.service.NotificationService;
import com.orionops.modules.search.service.SearchService;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link IncidentEventConsumer}.
 * Covers all four event types, error handling, and email resolution logic.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("IncidentEventConsumer")
class IncidentEventConsumerTest {

    @Mock
    private EmailService emailService;

    @Mock
    private SlackIntegrationService slackIntegrationService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SearchService searchService;

    private IncidentEventConsumer consumer;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private UUID assigneeId;
    private UUID incidentId;
    private UUID reporterId;

    @BeforeEach
    void setUp() {
        consumer = new IncidentEventConsumer(emailService, slackIntegrationService,
                notificationService, userRepository, objectMapper, searchService);
        assigneeId = UUID.randomUUID();
        incidentId = UUID.randomUUID();
        reporterId = UUID.randomUUID();
    }

    private ConsumerRecord<String, String> record(String json) {
        return new ConsumerRecord<>("orionops.incident.events", 0, 0, "key", json);
    }

    private String toJson(Object event) {
        try {
            return objectMapper.writeValueAsString(event);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private User buildUser(UUID id, String email) {
        User user = User.builder().email(email).build();
        user.setId(id);
        return user;
    }

    // ========================================================================
    // INCIDENT_CREATED
    // ========================================================================

    @Nested
    @DisplayName("handleIncidentCreated")
    class HandleIncidentCreated {

        @Test
        @DisplayName("with assignee: sends email, notification, and indexes incident")
        void withAssignee_sendsEmailAndNotificationAndIndexes() throws Exception {
            IncidentCreatedEvent event = IncidentCreatedEvent.builder()
                    .eventType("INCIDENT_CREATED")
                    .incidentId(incidentId)
                    .title("Server down")
                    .priority("HIGH")
                    .category("Hardware")
                    .reporterId(reporterId)
                    .assigneeId(assigneeId)
                    .build();
            String json = toJson(event);

            when(userRepository.findById(assigneeId))
                    .thenReturn(Optional.of(buildUser(assigneeId, "agent@orionops.io")));

            consumer.consumeIncidentEvent(record(json));

            verify(emailService).sendEmail(
                    eq("agent@orionops.io"),
                    eq("[OrionOps] New Incident Assigned: Server down"),
                    eq("incident-created"),
                    anyMap(),
                    isNull()
            );
            verify(notificationService).createNotification(
                    eq(assigneeId),
                    eq("New Incident Assigned: Server down"),
                    anyString(),
                    eq("INCIDENT"),
                    eq(incidentId),
                    eq("INCIDENT")
            );
            verify(searchService).indexIncident(eq(incidentId), eq("Server down"), eq("Hardware"), eq("OPEN"));
        }

        @Test
        @DisplayName("without assignee: only indexes, no email or notification")
        void withoutAssignee_onlyIndexes() throws Exception {
            IncidentCreatedEvent event = IncidentCreatedEvent.builder()
                    .eventType("INCIDENT_CREATED")
                    .incidentId(incidentId)
                    .title("Server down")
                    .priority("MEDIUM")
                    .category("Software")
                    .assigneeId(null)
                    .build();
            String json = toJson(event);

            consumer.consumeIncidentEvent(record(json));

            verifyNoInteractions(emailService, notificationService, userRepository);
            verify(searchService).indexIncident(eq(incidentId), anyString(), anyString(), eq("OPEN"));
        }

        @Test
        @DisplayName("user not found: uses fallback email for assignee")
        void userNotFound_usesFallbackEmail() throws Exception {
            IncidentCreatedEvent event = IncidentCreatedEvent.builder()
                    .eventType("INCIDENT_CREATED")
                    .incidentId(incidentId)
                    .title("Server down")
                    .priority("LOW")
                    .category("Network")
                    .assigneeId(assigneeId)
                    .build();
            String json = toJson(event);

            when(userRepository.findById(assigneeId)).thenReturn(Optional.empty());

            consumer.consumeIncidentEvent(record(json));

            verify(emailService).sendEmail(
                    eq("user-" + assigneeId + "@orionops.io"),
                    anyString(),
                    anyString(),
                    anyMap(),
                    isNull()
            );
            // Notification still attempted for the assignee
            verify(notificationService).createNotification(
                    eq(assigneeId), anyString(), anyString(), eq("INCIDENT"), eq(incidentId), eq("INCIDENT")
            );
        }
    }

    // ========================================================================
    // INCIDENT_ASSIGNED
    // ========================================================================

    @Nested
    @DisplayName("handleIncidentAssigned")
    class HandleIncidentAssigned {

        @Test
        @DisplayName("with assignee: sends email and creates notification")
        void withAssignee_sendsEmailAndNotification() throws Exception {
            IncidentAssignedEvent event = IncidentAssignedEvent.builder()
                    .eventType("INCIDENT_ASSIGNED")
                    .incidentId(incidentId)
                    .assigneeId(assigneeId)
                    .assignedBy("admin")
                    .build();
            String json = toJson(event);

            when(userRepository.findById(assigneeId))
                    .thenReturn(Optional.of(buildUser(assigneeId, "agent@orionops.io")));

            consumer.consumeIncidentEvent(record(json));

            verify(emailService).sendEmail(
                    eq("agent@orionops.io"),
                    eq("[OrionOps] Incident Assigned to You"),
                    eq("incident-assigned"),
                    anyMap(),
                    isNull()
            );
            verify(notificationService).createNotification(
                    eq(assigneeId),
                    eq("Incident Assigned to You"),
                    anyString(),
                    eq("INCIDENT"),
                    eq(incidentId),
                    eq("INCIDENT")
            );
        }

        @Test
        @DisplayName("without assignee: no email or notification sent")
        void withoutAssignee_noInteractions() throws Exception {
            IncidentAssignedEvent event = IncidentAssignedEvent.builder()
                    .eventType("INCIDENT_ASSIGNED")
                    .incidentId(incidentId)
                    .assigneeId(null)
                    .assignedBy("admin")
                    .build();
            String json = toJson(event);

            consumer.consumeIncidentEvent(record(json));

            verifyNoInteractions(emailService, notificationService, userRepository);
        }
    }

    // ========================================================================
    // INCIDENT_ESCALATED
    // ========================================================================

    @Nested
    @DisplayName("handleIncidentEscalated")
    class HandleIncidentEscalated {

        @Test
        @DisplayName("with newAssignee: sends urgent email, Slack, and notification")
        void withNewAssignee_multiChannelNotification() throws Exception {
            UUID newAssigneeId = UUID.randomUUID();
            IncidentEscalatedEvent event = IncidentEscalatedEvent.builder()
                    .eventType("INCIDENT_ESCALATED")
                    .incidentId(incidentId)
                    .escalationLevel(2)
                    .escalationReason("No response within SLA")
                    .escalatedBy(reporterId)
                    .newAssigneeId(newAssigneeId)
                    .build();
            String json = toJson(event);

            when(userRepository.findById(newAssigneeId))
                    .thenReturn(Optional.of(buildUser(newAssigneeId, "manager@orionops.io")));

            consumer.consumeIncidentEvent(record(json));

            verify(emailService).sendEmail(
                    eq("manager@orionops.io"),
                    anyString(),
                    anyString(),
                    anyMap(),
                    isNull()
            );
            verify(slackIntegrationService).sendNotification(
                    eq("#incidents"),
                    anyString()
            );
            verify(notificationService).createNotification(
                    eq(newAssigneeId),
                    anyString(),
                    anyString(),
                    eq("INCIDENT_ESCALATION"),
                    eq(incidentId),
                    eq("INCIDENT")
            );
        }

        @Test
        @DisplayName("without newAssignee: still posts to Slack")
        void withoutNewAssignee_stillSlack() throws Exception {
            IncidentEscalatedEvent event = IncidentEscalatedEvent.builder()
                    .eventType("INCIDENT_ESCALATED")
                    .incidentId(incidentId)
                    .escalationLevel(3)
                    .escalationReason("Critical SLA breach")
                    .newAssigneeId(null)
                    .build();
            String json = toJson(event);

            consumer.consumeIncidentEvent(record(json));

            verify(slackIntegrationService).sendNotification(eq("#incidents"), anyString());
            verifyNoInteractions(emailService, notificationService);
        }
    }

    // ========================================================================
    // INCIDENT_RESOLVED
    // ========================================================================

    @Nested
    @DisplayName("handleIncidentResolved")
    class HandleIncidentResolved {

        @Test
        @DisplayName("with resolvedBy: creates resolution notification")
        void withResolvedBy_createsNotification() throws Exception {
            UUID resolvedBy = UUID.randomUUID();
            IncidentResolvedEvent event = IncidentResolvedEvent.builder()
                    .eventType("INCIDENT_RESOLVED")
                    .incidentId(incidentId)
                    .resolvedBy(resolvedBy)
                    .resolution("Restarted the service")
                    .resolutionCode("FIXED")
                    .build();
            String json = toJson(event);

            consumer.consumeIncidentEvent(record(json));

            verify(notificationService).createNotification(
                    eq(resolvedBy),
                    eq("Incident Resolved: " + incidentId),
                    anyString(),
                    eq("INCIDENT_RESOLVED"),
                    eq(incidentId),
                    eq("INCIDENT")
            );
        }

        @Test
        @DisplayName("without resolvedBy: no notification created")
        void withoutResolvedBy_noNotification() throws Exception {
            IncidentResolvedEvent event = IncidentResolvedEvent.builder()
                    .eventType("INCIDENT_RESOLVED")
                    .incidentId(incidentId)
                    .resolvedBy(null)
                    .resolution("Auto-resolved")
                    .build();
            String json = toJson(event);

            consumer.consumeIncidentEvent(record(json));

            verifyNoInteractions(notificationService);
        }
    }

    // ========================================================================
    // EVENT ROUTING
    // ========================================================================

    @Nested
    @DisplayName("Event routing")
    class EventRouting {

        @Test
        @DisplayName("unknown event type: no crash, no downstream calls")
        void unknownEventType_noCrash() throws Exception {
            String json = "{\"eventType\":\"INCIDENT_DELETED\",\"incidentId\":\"" + incidentId + "\"}";
            assertThatCode(() -> consumer.consumeIncidentEvent(record(json)))
                    .doesNotThrowAnyException();
            verifyNoInteractions(emailService, slackIntegrationService, notificationService, searchService);
        }

        @Test
        @DisplayName("malformed JSON: gracefully handled as UNKNOWN")
        void malformedJson_gracefulHandling() {
            String json = "not-valid-json{{{";
            assertThatCode(() -> consumer.consumeIncidentEvent(record(json)))
                    .doesNotThrowAnyException();
            verifyNoInteractions(emailService, slackIntegrationService, notificationService, searchService);
        }

        @Test
        @DisplayName("missing eventType field: treated as UNKNOWN")
        void missingEventType_treatedAsUnknown() {
            String json = "{\"incidentId\":\"" + incidentId + "\",\"title\":\"test\"}";
            assertThatCode(() -> consumer.consumeIncidentEvent(record(json)))
                    .doesNotThrowAnyException();
            verifyNoInteractions(emailService, slackIntegrationService, notificationService, searchService);
        }
    }

    // ========================================================================
    // RESOLVE EMAIL FOR USER
    // ========================================================================

    @Nested
    @DisplayName("resolveEmailForUser")
    class ResolveEmailForUser {

        @Test
        @DisplayName("user found: returns actual email")
        void userFound_returnsEmail() throws Exception {
            IncidentCreatedEvent event = IncidentCreatedEvent.builder()
                    .eventType("INCIDENT_CREATED")
                    .incidentId(incidentId)
                    .title("Test")
                    .assigneeId(assigneeId)
                    .build();
            String json = toJson(event);

            when(userRepository.findById(assigneeId))
                    .thenReturn(Optional.of(buildUser(assigneeId, "real@orionops.io")));

            consumer.consumeIncidentEvent(record(json));

            verify(emailService).sendEmail(
                    eq("real@orionops.io"), anyString(), anyString(), anyMap(), isNull()
            );
        }

        @Test
        @DisplayName("user not found: returns fallback email")
        void userNotFound_returnsFallback() throws Exception {
            IncidentCreatedEvent event = IncidentCreatedEvent.builder()
                    .eventType("INCIDENT_CREATED")
                    .incidentId(incidentId)
                    .title("Test")
                    .assigneeId(assigneeId)
                    .build();
            String json = toJson(event);

            when(userRepository.findById(assigneeId)).thenReturn(Optional.empty());

            consumer.consumeIncidentEvent(record(json));

            verify(emailService).sendEmail(
                    eq("user-" + assigneeId + "@orionops.io"),
                    anyString(), anyString(), anyMap(), isNull()
            );
        }
    }
}
