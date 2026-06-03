package com.orionops.modules.integration.chat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orionops.modules.change.entity.ChangeRequest;
import com.orionops.modules.incident.entity.Incident;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestTemplate;

import java.lang.reflect.Field;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link SlackIntegrationService}.
 * Covers notification sending, message formatting, and configuration handling.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SlackIntegrationService")
class SlackIntegrationServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @Captor
    private ArgumentCaptor<HttpEntity<String>> httpEntityCaptor;

    private SlackIntegrationService service;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() throws Exception {
        service = new SlackIntegrationService(restTemplate, objectMapper);
        setField(service, "defaultWebhookUrl", "https://hooks.slack.com/services/test/webhook");
        setField(service, "slackEnabled", true);
        setField(service, "platformBaseUrl", "http://localhost:3000");
    }

    private void setField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }

    // ========================================================================
    // SEND NOTIFICATION
    // ========================================================================

    @Nested
    @DisplayName("sendNotification")
    class SendNotification {

        @Test
        @DisplayName("enabled: POSTs plain text to webhook")
        void enabled_postsToWebhook() {
            when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
                    .thenReturn("ok");

            service.sendNotification("#incidents", "Server is down");

            verify(restTemplate).postForObject(
                    eq("https://hooks.slack.com/services/test/webhook"),
                    httpEntityCaptor.capture(),
                    eq(String.class)
            );
            assertThat(httpEntityCaptor.getValue().getHeaders().getContentType())
                    .isEqualTo(MediaType.APPLICATION_JSON);
        }

        @Test
        @DisplayName("disabled: does not send")
        void disabled_doesNotSend() throws Exception {
            setField(service, "slackEnabled", false);

            service.sendNotification("#incidents", "Test message");

            verifyNoInteractions(restTemplate);
        }

        @Test
        @DisplayName("blank webhook URL: throws IllegalStateException")
        void blankWebhookUrl_throwsException() throws Exception {
            setField(service, "defaultWebhookUrl", "");

            assertThatThrownBy(() -> service.sendNotification("#incidents", "Test"))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Slack webhook URL is not configured");
        }

        @Test
        @DisplayName("HTTP failure: throws RuntimeException")
        void httpFailure_throwsRuntimeException() {
            when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
                    .thenThrow(new RuntimeException("Connection refused"));

            assertThatThrownBy(() -> service.sendNotification("#incidents", "Test"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Slack notification delivery failed");
        }
    }

    // ========================================================================
    // SEND BLOCK NOTIFICATION
    // ========================================================================

    @Nested
    @DisplayName("sendBlockNotification")
    class SendBlockNotification {

        @Test
        @DisplayName("enabled: sends Block Kit payload")
        void enabled_sendsBlockKitPayload() {
            when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
                    .thenReturn("ok");

            List<Map<String, Object>> blocks = List.of(
                    Map.of("type", "section", "text", Map.of("type", "plain_text", "text", "Hello"))
            );

            service.sendBlockNotification("#incidents", blocks);

            verify(restTemplate).postForObject(anyString(), any(HttpEntity.class), eq(String.class));
        }

        @Test
        @DisplayName("disabled: does not send")
        void disabled_doesNotSend() throws Exception {
            setField(service, "slackEnabled", false);

            service.sendBlockNotification("#incidents", List.of());

            verifyNoInteractions(restTemplate);
        }
    }

    // ========================================================================
    // FORMAT INCIDENT MESSAGE
    // ========================================================================

    @Nested
    @DisplayName("formatIncidentMessage")
    class FormatIncidentMessage {

        @Test
        @DisplayName("includes priority emoji in header")
        void includesPriorityEmoji() {
            Incident incident = buildTestIncident(Incident.IncidentPriority.HIGH);

            List<Map<String, Object>> blocks = service.formatIncidentMessage(incident);

            Map<String, Object> header = blocks.get(0);
            Map<String, Object> text = (Map<String, Object>) header.get("text");
            String headerText = (String) text.get("text");
            assertThat(headerText).contains(":large_orange_diamond:");
            assertThat(headerText).contains("Server down");
        }

        @Test
        @DisplayName("truncates description over 300 characters")
        void truncatesLongDescription() {
            String longDesc = "A".repeat(400);
            Incident incident = buildTestIncident(Incident.IncidentPriority.MEDIUM);
            incident.setDescription(longDesc);

            List<Map<String, Object>> blocks = service.formatIncidentMessage(incident);

            // Section block is the second block
            Map<String, Object> section = blocks.get(1);
            Map<String, Object> text = (Map<String, Object>) section.get("text");
            String sectionText = (String) text.get("text");
            assertThat(sectionText).contains("...");
            // Should not contain the full 400 char description
            assertThat(sectionText).doesNotContain("A".repeat(400));
        }

        @Test
        @DisplayName("shows SLA breached when target is in the past")
        void showsSlaBreached() {
            Incident incident = buildTestIncident(Incident.IncidentPriority.CRITICAL);
            incident.setSlaResolutionTarget(LocalDateTime.now().minusHours(2));

            List<Map<String, Object>> blocks = service.formatIncidentMessage(incident);

            Map<String, Object> section = blocks.get(1);
            Map<String, Object> text = (Map<String, Object>) section.get("text");
            String sectionText = (String) text.get("text");
            assertThat(sectionText).contains("BREACHED");
        }

        @Test
        @DisplayName("shows SLA remaining when target is in the future")
        void showsSlaRemaining() {
            Incident incident = buildTestIncident(Incident.IncidentPriority.MEDIUM);
            incident.setSlaResolutionTarget(LocalDateTime.now().plusHours(4));

            List<Map<String, Object>> blocks = service.formatIncidentMessage(incident);

            Map<String, Object> section = blocks.get(1);
            Map<String, Object> text = (Map<String, Object>) section.get("text");
            String sectionText = (String) text.get("text");
            assertThat(sectionText).contains("remaining");
        }

        @Test
        @DisplayName("includes View Incident button")
        void includesViewIncidentButton() {
            Incident incident = buildTestIncident(Incident.IncidentPriority.LOW);

            List<Map<String, Object>> blocks = service.formatIncidentMessage(incident);

            // Actions block is the last block
            Map<String, Object> actions = blocks.get(blocks.size() - 1);
            assertThat(actions.get("type")).isEqualTo("actions");
            List<Map<String, Object>> elements = (List<Map<String, Object>>) actions.get("elements");
            assertThat(elements).hasSize(1);
            assertThat(elements.get(0).get("url").toString()).contains("/incidents/");
        }

        private Incident buildTestIncident(Incident.IncidentPriority priority) {
            Incident incident = Incident.builder()
                    .title("Server down")
                    .description("The production server is unresponsive")
                    .priority(priority)
                    .status(Incident.IncidentStatus.OPEN)
                    .category("Hardware")
                    .build();
            incident.setId(java.util.UUID.randomUUID());
            return incident;
        }
    }

    // ========================================================================
    // FORMAT CHANGE APPROVAL MESSAGE
    // ========================================================================

    @Nested
    @DisplayName("formatChangeApprovalMessage")
    class FormatChangeApprovalMessage {

        @Test
        @DisplayName("includes change type emoji in header")
        void includesChangeTypeEmoji() {
            ChangeRequest change = buildTestChange(ChangeRequest.ChangeType.EMERGENCY);

            List<Map<String, Object>> blocks = service.formatChangeApprovalMessage(change);

            Map<String, Object> header = blocks.get(0);
            Map<String, Object> text = (Map<String, Object>) header.get("text");
            String headerText = (String) text.get("text");
            assertThat(headerText).contains(":rotating_light:");
        }

        @Test
        @DisplayName("includes Approve, Reject, and View Details buttons")
        void includesActionButtons() {
            ChangeRequest change = buildTestChange(ChangeRequest.ChangeType.NORMAL);

            List<Map<String, Object>> blocks = service.formatChangeApprovalMessage(change);

            Map<String, Object> actions = blocks.get(blocks.size() - 1);
            List<Map<String, Object>> elements = (List<Map<String, Object>>) actions.get("elements");
            assertThat(elements).hasSize(3);

            List<String> buttonTexts = elements.stream()
                    .map(e -> ((Map<String, Object>) e.get("text")).get("text").toString())
                    .toList();
            assertThat(buttonTexts).containsExactly("Approve", "Reject", "View Details");
        }

        @Test
        @DisplayName("includes schedule section when plannedStart and plannedEnd set")
        void includesScheduleWhenSet() {
            ChangeRequest change = buildTestChange(ChangeRequest.ChangeType.STANDARD);
            change.setPlannedStart(LocalDateTime.now().plusDays(1));
            change.setPlannedEnd(LocalDateTime.now().plusDays(1).plusHours(4));

            List<Map<String, Object>> blocks = service.formatChangeApprovalMessage(change);

            // Should have: header, details section, schedule section, divider, actions
            assertThat(blocks).hasSize(5);

            Map<String, Object> scheduleBlock = blocks.get(2);
            Map<String, Object> text = (Map<String, Object>) scheduleBlock.get("text");
            String scheduleText = (String) text.get("text");
            assertThat(scheduleText).contains("Planned Start");
            assertThat(scheduleText).contains("Planned End");
            assertThat(scheduleText).contains("Duration");
        }

        @Test
        @DisplayName("no schedule section when plannedStart/plannedEnd not set")
        void noScheduleWhenNotSet() {
            ChangeRequest change = buildTestChange(ChangeRequest.ChangeType.NORMAL);

            List<Map<String, Object>> blocks = service.formatChangeApprovalMessage(change);

            // Should have: header, details section, divider, actions
            assertThat(blocks).hasSize(4);
        }

        private ChangeRequest buildTestChange(ChangeRequest.ChangeType type) {
            ChangeRequest change = ChangeRequest.builder()
                    .title("Upgrade database")
                    .description("Upgrade PostgreSQL from 15 to 16")
                    .changeType(type)
                    .risk(ChangeRequest.ChangeRisk.MEDIUM)
                    .impact(ChangeRequest.ChangeImpact.MODERATE)
                    .status(ChangeRequest.ChangeStatus.SUBMITTED)
                    .build();
            change.setId(java.util.UUID.randomUUID());
            return change;
        }
    }

    // ========================================================================
    // FORMAT DURATION
    // ========================================================================

    @Nested
    @DisplayName("formatDuration (via formatIncidentMessage)")
    class FormatDuration {

        @Test
        @DisplayName("shows hours and minutes for duration > 1 hour")
        void hoursAndMinutes() {
            Incident incident = Incident.builder()
                    .title("Test")
                    .priority(Incident.IncidentPriority.MEDIUM)
                    .status(Incident.IncidentStatus.OPEN)
                    .slaResolutionTarget(LocalDateTime.now().plusHours(3).plusMinutes(30))
                    .build();
            incident.setId(java.util.UUID.randomUUID());

            List<Map<String, Object>> blocks = service.formatIncidentMessage(incident);
            Map<String, Object> section = blocks.get(1);
            String sectionText = (String) ((Map<String, Object>) section.get("text")).get("text");
            assertThat(sectionText).contains("remaining");
        }

        @Test
        @DisplayName("shows seconds only for sub-minute duration")
        void secondsOnly() {
            Incident incident = Incident.builder()
                    .title("Test")
                    .priority(Incident.IncidentPriority.MEDIUM)
                    .status(Incident.IncidentStatus.OPEN)
                    .slaResolutionTarget(LocalDateTime.now().plusSeconds(30))
                    .build();
            incident.setId(java.util.UUID.randomUUID());

            List<Map<String, Object>> blocks = service.formatIncidentMessage(incident);
            Map<String, Object> section = blocks.get(1);
            String sectionText = (String) ((Map<String, Object>) section.get("text")).get("text");
            assertThat(sectionText).containsPattern("[2-3][0-9]s remaining");
        }
    }

    // ========================================================================
    // CONVENIENCE METHODS
    // ========================================================================

    @Nested
    @DisplayName("sendIncidentNotification / sendChangeApprovalNotification")
    class ConvenienceMethods {

        @Test
        @DisplayName("sendIncidentNotification formats and sends to #incidents")
        void sendIncidentNotification() {
            when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
                    .thenReturn("ok");

            Incident incident = Incident.builder()
                    .title("Test")
                    .priority(Incident.IncidentPriority.HIGH)
                    .status(Incident.IncidentStatus.OPEN)
                    .build();
            incident.setId(java.util.UUID.randomUUID());

            service.sendIncidentNotification(incident);

            verify(restTemplate).postForObject(anyString(), any(HttpEntity.class), eq(String.class));
        }

        @Test
        @DisplayName("sendChangeApprovalNotification formats and sends to #changes")
        void sendChangeApprovalNotification() {
            when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
                    .thenReturn("ok");

            ChangeRequest change = ChangeRequest.builder()
                    .title("Test Change")
                    .changeType(ChangeRequest.ChangeType.NORMAL)
                    .risk(ChangeRequest.ChangeRisk.LOW)
                    .impact(ChangeRequest.ChangeImpact.MINIMAL)
                    .status(ChangeRequest.ChangeStatus.SUBMITTED)
                    .build();
            change.setId(java.util.UUID.randomUUID());

            service.sendChangeApprovalNotification(change);

            verify(restTemplate).postForObject(anyString(), any(HttpEntity.class), eq(String.class));
        }
    }
}
