package com.orionops.modules.integration.consumers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orionops.modules.auth.entity.User;
import com.orionops.modules.auth.repository.UserRepository;
import com.orionops.modules.cmdb.entity.Service;
import com.orionops.modules.cmdb.repository.ServiceRepository;
import com.orionops.modules.integration.chat.SlackIntegrationService;
import com.orionops.modules.integration.email.EmailService;
import com.orionops.modules.notification.service.NotificationService;
import com.orionops.modules.sla.event.SLABreachEvent;
import com.orionops.modules.sla.event.SLACreatedEvent;
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
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link SLAEventConsumer}.
 * Covers SLA breach and creation event handling, service owner resolution, and error handling.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SLAEventConsumer")
class SLAEventConsumerTest {

    @Mock
    private EmailService emailService;

    @Mock
    private SlackIntegrationService slackIntegrationService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private ServiceRepository serviceRepository;

    @Mock
    private UserRepository userRepository;

    private SLAEventConsumer consumer;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private UUID slaInstanceId;
    private UUID targetEntityId;
    private UUID ownerId;

    @BeforeEach
    void setUp() {
        consumer = new SLAEventConsumer(emailService, slackIntegrationService,
                notificationService, serviceRepository, userRepository, objectMapper);
        slaInstanceId = UUID.randomUUID();
        targetEntityId = UUID.randomUUID();
        ownerId = UUID.randomUUID();
    }

    private ConsumerRecord<String, String> record(String json) {
        return new ConsumerRecord<>("orionops.sla.events", 0, 0, "key", json);
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

    private Service buildService(UUID id, String owner) {
        Service svc = Service.builder().name("Test Service").owner(owner).build();
        svc.setId(id);
        return svc;
    }

    // ========================================================================
    // SLA_BREACHED
    // ========================================================================

    @Nested
    @DisplayName("handleSLABreach")
    class HandleSLABreach {

        @Test
        @DisplayName("with UUID owner: sends urgent email, Slack alert, and notification")
        void withUuidOwner_multiChannelNotification() throws Exception {
            SLABreachEvent event = SLABreachEvent.builder()
                    .eventType("SLA_BREACHED")
                    .slaInstanceId(slaInstanceId)
                    .targetEntityId(targetEntityId)
                    .targetType("INCIDENT")
                    .breachType("RESOLUTION_TIME")
                    .build();
            String json = toJson(event);

            Service svc = buildService(targetEntityId, ownerId.toString());
            when(serviceRepository.findById(targetEntityId)).thenReturn(Optional.of(svc));
            when(userRepository.findById(ownerId))
                    .thenReturn(Optional.of(buildUser(ownerId, "owner@orionops.io")));

            consumer.consumeSLAEvent(record(json));

            verify(emailService).sendEmail(
                    eq("owner@orionops.io"),
                    anyString(),
                    eq("sla-breached"),
                    anyMap(),
                    isNull()
            );
            verify(slackIntegrationService).sendNotification(eq("#sla-alerts"), anyString());
            verify(notificationService).createNotification(
                    eq(ownerId),
                    anyString(),
                    anyString(),
                    eq("SLA_BREACH"),
                    eq(slaInstanceId),
                    eq("SLA")
            );
        }

        @Test
        @DisplayName("with username owner: resolves by username lookup")
        void withUsernameOwner_resolvesByUsername() throws Exception {
            SLABreachEvent event = SLABreachEvent.builder()
                    .eventType("SLA_BREACHED")
                    .slaInstanceId(slaInstanceId)
                    .targetEntityId(targetEntityId)
                    .targetType("INCIDENT")
                    .breachType("RESPONSE_TIME")
                    .build();
            String json = toJson(event);

            // Owner is a username string, not a UUID
            Service svc = buildService(targetEntityId, "jsmith");
            when(serviceRepository.findById(targetEntityId)).thenReturn(Optional.of(svc));
            when(userRepository.findByUsername("jsmith"))
                    .thenReturn(Optional.of(buildUser(ownerId, "jsmith@orionops.io")));

            consumer.consumeSLAEvent(record(json));

            verify(emailService).sendEmail(
                    eq("jsmith@orionops.io"),
                    anyString(),
                    anyString(),
                    anyMap(),
                    isNull()
            );
        }

        @Test
        @DisplayName("service not found: uses fallback email")
        void serviceNotFound_usesFallbackEmail() throws Exception {
            SLABreachEvent event = SLABreachEvent.builder()
                    .eventType("SLA_BREACHED")
                    .slaInstanceId(slaInstanceId)
                    .targetEntityId(targetEntityId)
                    .targetType("INCIDENT")
                    .breachType("RESOLUTION_TIME")
                    .build();
            String json = toJson(event);

            when(serviceRepository.findById(targetEntityId)).thenReturn(Optional.empty());

            consumer.consumeSLAEvent(record(json));

            verify(emailService).sendEmail(
                    eq("service-owner-" + targetEntityId + "@orionops.io"),
                    anyString(),
                    anyString(),
                    anyMap(),
                    isNull()
            );
        }

        @Test
        @DisplayName("service with null owner: uses fallback email")
        void serviceNullOwner_usesFallbackEmail() throws Exception {
            SLABreachEvent event = SLABreachEvent.builder()
                    .eventType("SLA_BREACHED")
                    .slaInstanceId(slaInstanceId)
                    .targetEntityId(targetEntityId)
                    .targetType("INCIDENT")
                    .breachType("RESOLUTION_TIME")
                    .build();
            String json = toJson(event);

            Service svc = buildService(targetEntityId, null);
            when(serviceRepository.findById(targetEntityId)).thenReturn(Optional.of(svc));

            consumer.consumeSLAEvent(record(json));

            verify(emailService).sendEmail(
                    eq("service-owner-" + targetEntityId + "@orionops.io"),
                    anyString(),
                    anyString(),
                    anyMap(),
                    isNull()
            );
        }

        @Test
        @DisplayName("Slack and email both sent even if notification resolution finds no owner")
        void noOwner_emailAndSlackStillSent() throws Exception {
            SLABreachEvent event = SLABreachEvent.builder()
                    .eventType("SLA_BREACHED")
                    .slaInstanceId(slaInstanceId)
                    .targetEntityId(targetEntityId)
                    .targetType("SERVICE_REQUEST")
                    .breachType("RESPONSE_TIME")
                    .build();
            String json = toJson(event);

            when(serviceRepository.findById(targetEntityId)).thenReturn(Optional.empty());

            consumer.consumeSLAEvent(record(json));

            verify(emailService).sendEmail(anyString(), anyString(), anyString(), anyMap(), isNull());
            verify(slackIntegrationService).sendNotification(eq("#sla-alerts"), anyString());
        }
    }

    // ========================================================================
    // SLA_CREATED
    // ========================================================================

    @Nested
    @DisplayName("handleSLACreated")
    class HandleSLACreated {

        @Test
        @DisplayName("SLA created event: no external calls, only logging")
        void slaCreated_noExternalCalls() throws Exception {
            UUID slaDefinitionId = UUID.randomUUID();
            SLACreatedEvent event = SLACreatedEvent.builder()
                    .eventType("SLA_CREATED")
                    .slaInstanceId(slaInstanceId)
                    .targetEntityId(targetEntityId)
                    .targetType("INCIDENT")
                    .slaDefinitionId(slaDefinitionId)
                    .build();
            String json = toJson(event);

            consumer.consumeSLAEvent(record(json));

            verifyNoInteractions(emailService, slackIntegrationService, notificationService,
                    serviceRepository, userRepository);
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
            String json = "{\"eventType\":\"SLA_PAUSED\",\"slaInstanceId\":\"" + slaInstanceId + "\"}";
            assertThatCode(() -> consumer.consumeSLAEvent(record(json)))
                    .doesNotThrowAnyException();
            verifyNoInteractions(emailService, slackIntegrationService, notificationService);
        }

        @Test
        @DisplayName("malformed JSON: gracefully handled")
        void malformedJson_gracefulHandling() {
            String json = "{{{invalid";
            assertThatCode(() -> consumer.consumeSLAEvent(record(json)))
                    .doesNotThrowAnyException();
            verifyNoInteractions(emailService, slackIntegrationService, notificationService);
        }

        @Test
        @DisplayName("missing eventType: treated as UNKNOWN")
        void missingEventType_treatedAsUnknown() {
            String json = "{\"slaInstanceId\":\"" + slaInstanceId + "\"}";
            assertThatCode(() -> consumer.consumeSLAEvent(record(json)))
                    .doesNotThrowAnyException();
            verifyNoInteractions(emailService, slackIntegrationService, notificationService);
        }
    }

    // ========================================================================
    // RESOLVE SERVICE OWNER EMAIL
    // ========================================================================

    @Nested
    @DisplayName("resolveServiceOwnerEmail")
    class ResolveServiceOwnerEmail {

        @Test
        @DisplayName("owner is valid UUID: resolves directly by user ID")
        void ownerIsUuid_resolvesDirectly() throws Exception {
            SLABreachEvent event = SLABreachEvent.builder()
                    .eventType("SLA_BREACHED")
                    .slaInstanceId(slaInstanceId)
                    .targetEntityId(targetEntityId)
                    .targetType("INCIDENT")
                    .breachType("RESOLUTION_TIME")
                    .build();
            String json = toJson(event);

            Service svc = buildService(targetEntityId, ownerId.toString());
            when(serviceRepository.findById(targetEntityId)).thenReturn(Optional.of(svc));
            when(userRepository.findById(ownerId))
                    .thenReturn(Optional.of(buildUser(ownerId, "direct@orionops.io")));

            consumer.consumeSLAEvent(record(json));

            verify(userRepository).findById(ownerId);
            verify(emailService).sendEmail(eq("direct@orionops.io"), anyString(), anyString(), anyMap(), isNull());
        }

        @Test
        @DisplayName("owner is username: resolves via username lookup")
        void ownerIsUsername_resolvesByUsername() throws Exception {
            SLABreachEvent event = SLABreachEvent.builder()
                    .eventType("SLA_BREACHED")
                    .slaInstanceId(slaInstanceId)
                    .targetEntityId(targetEntityId)
                    .targetType("INCIDENT")
                    .breachType("RESOLUTION_TIME")
                    .build();
            String json = toJson(event);

            Service svc = buildService(targetEntityId, "admin-user");
            when(serviceRepository.findById(targetEntityId)).thenReturn(Optional.of(svc));
            when(userRepository.findByUsername("admin-user"))
                    .thenReturn(Optional.of(buildUser(ownerId, "admin@orionops.io")));

            consumer.consumeSLAEvent(record(json));

            verify(userRepository, atLeastOnce()).findByUsername("admin-user");
            verify(emailService).sendEmail(eq("admin@orionops.io"), anyString(), anyString(), anyMap(), isNull());
        }

        @Test
        @DisplayName("owner UUID not found in users: uses fallback email")
        void ownerUuidNotFoundInUsers_usesFallbackEmail() throws Exception {
            SLABreachEvent event = SLABreachEvent.builder()
                    .eventType("SLA_BREACHED")
                    .slaInstanceId(slaInstanceId)
                    .targetEntityId(targetEntityId)
                    .targetType("INCIDENT")
                    .breachType("RESOLUTION_TIME")
                    .build();
            String json = toJson(event);

            Service svc = buildService(targetEntityId, ownerId.toString());
            when(serviceRepository.findById(targetEntityId)).thenReturn(Optional.of(svc));
            when(userRepository.findById(ownerId)).thenReturn(Optional.empty());

            consumer.consumeSLAEvent(record(json));

            verify(emailService).sendEmail(
                    eq("service-owner-" + targetEntityId + "@orionops.io"),
                    anyString(), anyString(), anyMap(), isNull()
            );
        }
    }
}
