package com.orionops.modules.integration.consumers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orionops.modules.auth.entity.User;
import com.orionops.modules.auth.repository.UserRepository;
import com.orionops.modules.change.entity.ChangeRequest;
import com.orionops.modules.change.event.ChangeApprovedEvent;
import com.orionops.modules.change.event.ChangeImplementedEvent;
import com.orionops.modules.change.event.ChangeRejectedEvent;
import com.orionops.modules.change.repository.ChangeRequestRepository;
import com.orionops.modules.integration.email.EmailService;
import com.orionops.modules.notification.service.NotificationService;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link ChangeEventConsumer}.
 * Covers all three change event types, email resolution, and error handling.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ChangeEventConsumer")
class ChangeEventConsumerTest {

    @Mock
    private EmailService emailService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ChangeRequestRepository changeRequestRepository;

    private ChangeEventConsumer consumer;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private UUID changeId;
    private UUID assigneeId;
    private UUID requesterId;
    private UUID approverId;

    @BeforeEach
    void setUp() {
        consumer = new ChangeEventConsumer(emailService, notificationService,
                userRepository, changeRequestRepository, objectMapper);
        changeId = UUID.randomUUID();
        assigneeId = UUID.randomUUID();
        requesterId = UUID.randomUUID();
        approverId = UUID.randomUUID();
    }

    private ConsumerRecord<String, String> record(String json) {
        return new ConsumerRecord<>("orionops.change.events", 0, 0, "key", json);
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

    private ChangeRequest buildChangeRequest(UUID assigneeId, UUID requesterId, UUID approverId) {
        ChangeRequest cr = ChangeRequest.builder()
                .title("Test Change")
                .assigneeId(assigneeId)
                .requesterId(requesterId)
                .approverId(approverId)
                .build();
        cr.setId(changeId);
        return cr;
    }

    // ========================================================================
    // CHANGE_APPROVED
    // ========================================================================

    @Nested
    @DisplayName("handleChangeApproved")
    class HandleChangeApproved {

        @Test
        @DisplayName("sends email to implementation team and notifies assignee")
        void sendsEmailAndNotifiesAssignee() throws Exception {
            ChangeApprovedEvent event = ChangeApprovedEvent.builder()
                    .eventType("CHANGE_APPROVED")
                    .changeId(changeId)
                    .approvedBy(approverId)
                    .build();
            String json = toJson(event);

            ChangeRequest cr = buildChangeRequest(assigneeId, requesterId, approverId);
            when(changeRequestRepository.findById(changeId)).thenReturn(Optional.of(cr));
            when(userRepository.findById(assigneeId))
                    .thenReturn(Optional.of(buildUser(assigneeId, "impl@orionops.io")));

            consumer.consumeChangeEvent(record(json));

            verify(emailService).sendEmail(
                    eq("impl@orionops.io"),
                    eq("[OrionOps] Change Request Approved - Ready for Implementation"),
                    eq("change-approved"),
                    anyMap(),
                    isNull()
            );
            verify(notificationService).createNotification(
                    eq(assigneeId),
                    eq("Change Request Approved - Ready for Implementation"),
                    anyString(),
                    eq("CHANGE"),
                    eq(changeId),
                    eq("CHANGE")
            );
        }

        @Test
        @DisplayName("change not found: uses fallback email, no notification")
        void changeNotFound_usesFallbackEmail() throws Exception {
            ChangeApprovedEvent event = ChangeApprovedEvent.builder()
                    .eventType("CHANGE_APPROVED")
                    .changeId(changeId)
                    .approvedBy(approverId)
                    .build();
            String json = toJson(event);

            when(changeRequestRepository.findById(changeId)).thenReturn(Optional.empty());

            consumer.consumeChangeEvent(record(json));

            verify(emailService).sendEmail(
                    eq("implementation-team@orionops.io"),
                    anyString(),
                    anyString(),
                    anyMap(),
                    isNull()
            );
        }

        @Test
        @DisplayName("assignee null on change: uses fallback email")
        void assigneeNull_usesFallbackEmail() throws Exception {
            ChangeApprovedEvent event = ChangeApprovedEvent.builder()
                    .eventType("CHANGE_APPROVED")
                    .changeId(changeId)
                    .approvedBy(approverId)
                    .build();
            String json = toJson(event);

            ChangeRequest cr = buildChangeRequest(null, requesterId, approverId);
            when(changeRequestRepository.findById(changeId)).thenReturn(Optional.of(cr));

            consumer.consumeChangeEvent(record(json));

            verify(emailService).sendEmail(
                    eq("implementation-team@orionops.io"),
                    anyString(),
                    anyString(),
                    anyMap(),
                    isNull()
            );
        }
    }

    // ========================================================================
    // CHANGE_REJECTED
    // ========================================================================

    @Nested
    @DisplayName("handleChangeRejected")
    class HandleChangeRejected {

        @Test
        @DisplayName("sends rejection email to requester and creates notification")
        void sendsRejectionEmailAndNotification() throws Exception {
            ChangeRejectedEvent event = ChangeRejectedEvent.builder()
                    .eventType("CHANGE_REJECTED")
                    .changeId(changeId)
                    .rejectedBy(approverId)
                    .rejectionReason("Risk too high")
                    .build();
            String json = toJson(event);

            ChangeRequest cr = buildChangeRequest(assigneeId, requesterId, approverId);
            when(changeRequestRepository.findById(changeId)).thenReturn(Optional.of(cr));
            when(userRepository.findById(requesterId))
                    .thenReturn(Optional.of(buildUser(requesterId, "requester@orionops.io")));

            consumer.consumeChangeEvent(record(json));

            verify(emailService).sendEmail(
                    eq("requester@orionops.io"),
                    eq("[OrionOps] Change Request Rejected"),
                    anyString(),
                    anyMap(),
                    isNull()
            );
            verify(notificationService).createNotification(
                    eq(requesterId),
                    eq("Change Request Rejected"),
                    anyString(),
                    eq("CHANGE"),
                    eq(changeId),
                    eq("CHANGE")
            );
        }

        @Test
        @DisplayName("change not found: uses fallback requester email")
        void changeNotFound_usesFallbackRequesterEmail() throws Exception {
            ChangeRejectedEvent event = ChangeRejectedEvent.builder()
                    .eventType("CHANGE_REJECTED")
                    .changeId(changeId)
                    .rejectedBy(approverId)
                    .rejectionReason("Not approved")
                    .build();
            String json = toJson(event);

            when(changeRequestRepository.findById(changeId)).thenReturn(Optional.empty());

            consumer.consumeChangeEvent(record(json));

            verify(emailService).sendEmail(
                    eq("requester-" + changeId + "@orionops.io"),
                    anyString(),
                    anyString(),
                    anyMap(),
                    isNull()
            );
        }
    }

    // ========================================================================
    // CHANGE_IMPLEMENTED
    // ========================================================================

    @Nested
    @DisplayName("handleChangeImplemented")
    class HandleChangeImplemented {

        @Test
        @DisplayName("sends completion email to stakeholders and notifies requester")
        void sendsCompletionEmailAndNotifiesRequester() throws Exception {
            ChangeImplementedEvent event = ChangeImplementedEvent.builder()
                    .eventType("CHANGE_IMPLEMENTED")
                    .changeId(changeId)
                    .implementedBy(assigneeId)
                    .implementationNotes("Deployed successfully")
                    .build();
            String json = toJson(event);

            ChangeRequest cr = buildChangeRequest(assigneeId, requesterId, approverId);
            when(changeRequestRepository.findById(changeId)).thenReturn(Optional.of(cr));
            when(userRepository.findById(approverId))
                    .thenReturn(Optional.of(buildUser(approverId, "approver@orionops.io")));

            consumer.consumeChangeEvent(record(json));

            verify(emailService).sendEmail(
                    eq("approver@orionops.io"),
                    eq("[OrionOps] Change Implementation Complete"),
                    anyString(),
                    anyMap(),
                    isNull()
            );
            verify(notificationService).createNotification(
                    eq(requesterId),
                    eq("Change Implementation Complete"),
                    anyString(),
                    eq("CHANGE"),
                    eq(changeId),
                    eq("CHANGE")
            );
        }

        @Test
        @DisplayName("requester null: falls back to approver for notification")
        void requesterNull_fallsBackToApprover() throws Exception {
            ChangeImplementedEvent event = ChangeImplementedEvent.builder()
                    .eventType("CHANGE_IMPLEMENTED")
                    .changeId(changeId)
                    .implementedBy(assigneeId)
                    .build();
            String json = toJson(event);

            // Requester is null, approver is set
            ChangeRequest cr = buildChangeRequest(assigneeId, null, approverId);
            when(changeRequestRepository.findById(changeId)).thenReturn(Optional.of(cr));
            when(userRepository.findById(approverId))
                    .thenReturn(Optional.of(buildUser(approverId, "approver@orionops.io")));

            consumer.consumeChangeEvent(record(json));

            verify(notificationService).createNotification(
                    eq(approverId),
                    anyString(),
                    anyString(),
                    eq("CHANGE"),
                    eq(changeId),
                    eq("CHANGE")
            );
        }

        @Test
        @DisplayName("change not found: uses fallback stakeholders email")
        void changeNotFound_usesFallbackStakeholdersEmail() throws Exception {
            ChangeImplementedEvent event = ChangeImplementedEvent.builder()
                    .eventType("CHANGE_IMPLEMENTED")
                    .changeId(changeId)
                    .implementedBy(assigneeId)
                    .build();
            String json = toJson(event);

            when(changeRequestRepository.findById(changeId)).thenReturn(Optional.empty());

            consumer.consumeChangeEvent(record(json));

            verify(emailService).sendEmail(
                    eq("stakeholders-" + changeId + "@orionops.io"),
                    anyString(),
                    anyString(),
                    anyMap(),
                    isNull()
            );
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
        void unknownEventType_noCrash() {
            String json = "{\"eventType\":\"CHANGE_CANCELLED\",\"changeId\":\"" + changeId + "\"}";
            assertThatCode(() -> consumer.consumeChangeEvent(record(json)))
                    .doesNotThrowAnyException();
            verifyNoInteractions(emailService, notificationService);
        }

        @Test
        @DisplayName("malformed JSON: gracefully handled")
        void malformedJson_gracefulHandling() {
            String json = "{broken json!!!";
            assertThatCode(() -> consumer.consumeChangeEvent(record(json)))
                    .doesNotThrowAnyException();
            verifyNoInteractions(emailService, notificationService);
        }

        @Test
        @DisplayName("missing eventType: treated as UNKNOWN")
        void missingEventType_treatedAsUnknown() {
            String json = "{\"changeId\":\"" + changeId + "\"}";
            assertThatCode(() -> consumer.consumeChangeEvent(record(json)))
                    .doesNotThrowAnyException();
            verifyNoInteractions(emailService, notificationService);
        }
    }
}
