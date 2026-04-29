package com.orionops.modules.integration.chat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orionops.modules.incident.entity.Incident;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Microsoft Teams integration service for sending notifications via Teams Incoming Webhooks.
 *
 * <p>Formats messages using Adaptive Cards (Microsoft's card format) for rich,
 * structured notifications. Supports incident alerts, status updates, and
 * actionable messages with response buttons.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TeamsIntegrationService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${orionops.integrations.teams.webhook-url:}")
    private String defaultWebhookUrl;

    @Value("${orionops.integrations.teams.enabled:false}")
    private boolean teamsEnabled;

    @Value("${orionops.platform.base-url:http://localhost:3000}")
    private String platformBaseUrl;

    /**
     * Sends a notification to a Microsoft Teams channel via Incoming Webhook.
     *
     * @param webhookUrl the Teams webhook URL to post to (null uses default)
     * @param message    the plain text message to send
     */
    public void sendNotification(String webhookUrl, String message) {
        if (!teamsEnabled) {
            log.warn("Teams integration is disabled. Would have sent: {}", message);
            return;
        }

        String url = (webhookUrl != null && !webhookUrl.isBlank()) ? webhookUrl : defaultWebhookUrl;
        if (url == null || url.isBlank()) {
            throw new IllegalStateException("Teams webhook URL is not configured");
        }

        Map<String, Object> card = createSimpleCard(message);
        sendAdaptiveCard(url, card);
    }

    /**
     * Sends an Adaptive Card notification to a Teams channel.
     *
     * @param webhookUrl the Teams webhook URL (null uses default)
     * @param adaptiveCard the Adaptive Card JSON payload as a Map
     */
    public void sendAdaptiveCardNotification(String webhookUrl, Map<String, Object> adaptiveCard) {
        if (!teamsEnabled) {
            log.warn("Teams integration is disabled. Would have sent Adaptive Card notification");
            return;
        }

        String url = (webhookUrl != null && !webhookUrl.isBlank()) ? webhookUrl : defaultWebhookUrl;
        if (url == null || url.isBlank()) {
            throw new IllegalStateException("Teams webhook URL is not configured");
        }

        sendAdaptiveCard(url, adaptiveCard);
    }

    /**
     * Formats an incident into a Microsoft Adaptive Card JSON payload.
     *
     * <p>Creates an Adaptive Card with:
     * - Title with priority indicator
     * - Fact set with status, priority, category, and SLA details
     * - Description text block
     * - Action set with a link to view the incident in the platform
     * </p>
     *
     * @param incident the incident entity to format
     * @return Map representing the complete Adaptive Card message for Teams webhook
     */
    public Map<String, Object> formatAdaptiveCard(Incident incident) {
        Map<String, Object> message = new HashMap<>();

        // Wrap in the Teams webhook message format
        message.put("type", "message");

        // Build the Attachment with Adaptive Card
        Map<String, Object> attachment = new HashMap<>();
        attachment.put("contentType", "application/vnd.microsoft.card.adaptive");
        attachment.put("contentUrl", null);

        // Build the Adaptive Card
        Map<String, Object> card = new HashMap<>();
        card.put("$schema", "http://adaptivecards.io/schemas/adaptive-card.json");
        card.put("type", "AdaptiveCard");
        card.put("version", "1.4");

        List<Map<String, Object>> body = new ArrayList<>();

        // Title block with priority color
        String priorityColor = getPriorityColor(incident.getPriority());
        Map<String, Object> titleContainer = new HashMap<>();
        titleContainer.put("type", "Container");
        titleContainer.put("style", "emphasis");
        titleContainer.put("bleed", true);

        List<Map<String, Object>> titleItems = new ArrayList<>();
        Map<String, Object> titleBlock = new HashMap<>();
        titleBlock.put("type", "TextBlock");
        titleBlock.put("text", getPriorityEmoji(incident.getPriority()) + " Incident Alert");
        titleBlock.put("size", "Large");
        titleBlock.put("weight", "Bolder");
        titleBlock.put("color", priorityColor);
        titleItems.add(titleBlock);

        Map<String, Object> subtitleBlock = new HashMap<>();
        subtitleBlock.put("type", "TextBlock");
        subtitleBlock.put("text", incident.getTitle());
        subtitleBlock.put("size", "Medium");
        subtitleBlock.put("wrap", true);
        titleItems.add(subtitleBlock);

        titleContainer.put("items", titleItems);
        body.add(titleContainer);

        // Fact set with incident details
        Map<String, Object> factSet = new HashMap<>();
        factSet.put("type", "FactSet");
        List<Map<String, String>> facts = new ArrayList<>();

        facts.add(Map.of("title", "Status", "value", incident.getStatus().toString()));
        facts.add(Map.of("title", "Priority", "value", incident.getPriority().toString()));
        facts.add(Map.of("title", "Category", "value",
                incident.getCategory() != null ? incident.getCategory() : "Uncategorized"));

        if (incident.getImpact() != null) {
            facts.add(Map.of("title", "Impact", "value", incident.getImpact().toString()));
        }
        if (incident.getUrgency() != null) {
            facts.add(Map.of("title", "Urgency", "value", incident.getUrgency().toString()));
        }

        // SLA information
        if (incident.getSlaResolutionTarget() != null) {
            Duration remaining = Duration.between(LocalDateTime.now(), incident.getSlaResolutionTarget());
            String slaText;
            if (remaining.isNegative()) {
                slaText = "BREACHED by " + formatDuration(remaining.abs());
            } else {
                slaText = formatDuration(remaining) + " remaining";
            }
            facts.add(Map.of("title", "SLA Resolution", "value", slaText));
        }

        if (incident.getSlaResponseTarget() != null) {
            Duration responseRemaining = Duration.between(LocalDateTime.now(), incident.getSlaResponseTarget());
            String responseText;
            if (responseRemaining.isNegative()) {
                responseText = "BREACHED by " + formatDuration(responseRemaining.abs());
            } else {
                responseText = formatDuration(responseRemaining) + " remaining";
            }
            facts.add(Map.of("title", "SLA Response", "value", responseText));
        }

        if (incident.getCreatedAt() != null) {
            facts.add(Map.of("title", "Created", "value", incident.getCreatedAt().toString()));
        }

        factSet.put("facts", facts);
        body.add(factSet);

        // Description block
        if (incident.getDescription() != null && !incident.getDescription().isBlank()) {
            Map<String, Object> descBlock = new HashMap<>();
            descBlock.put("type", "TextBlock");
            String desc = incident.getDescription();
            if (desc.length() > 500) {
                desc = desc.substring(0, 500) + "...";
            }
            descBlock.put("text", desc);
            descBlock.put("wrap", true);
            descBlock.put("spacing", "Medium");
            body.add(descBlock);
        }

        card.put("body", body);

        // Actions
        List<Map<String, Object>> actions = new ArrayList<>();
        String incidentUrl = platformBaseUrl + "/incidents/" + incident.getId();

        Map<String, Object> viewAction = new HashMap<>();
        viewAction.put("type", "Action.OpenUrl");
        viewAction.put("title", "View Incident");
        viewAction.put("url", incidentUrl);
        actions.add(viewAction);

        card.put("actions", actions);

        attachment.put("content", card);
        message.put("attachments", List.of(attachment));

        return message;
    }

    /**
     * Sends an incident notification to the configured Teams channel.
     * Convenience method that combines formatting and sending.
     *
     * @param incident the incident to notify about
     */
    public void sendIncidentNotification(Incident incident) {
        Map<String, Object> card = formatAdaptiveCard(incident);
        sendAdaptiveCardNotification(null, card);
    }

    // ---- Private helpers ----

    /**
     * Sends an Adaptive Card payload to a Teams webhook URL.
     */
    private void sendAdaptiveCard(String webhookUrl, Map<String, Object> cardPayload) {
        try {
            String jsonBody = objectMapper.writeValueAsString(cardPayload);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> request = new HttpEntity<>(jsonBody, headers);
            String response = restTemplate.postForObject(webhookUrl, request, String.class);

            log.info("Teams notification sent successfully. Response: {}", response);
        } catch (Exception e) {
            log.error("Failed to send Teams notification: {}", e.getMessage(), e);
            throw new RuntimeException("Teams notification delivery failed", e);
        }
    }

    /**
     * Creates a simple Adaptive Card with just a text message.
     */
    private Map<String, Object> createSimpleCard(String message) {
        Map<String, Object> teamsMessage = new HashMap<>();
        teamsMessage.put("type", "message");

        Map<String, Object> attachment = new HashMap<>();
        attachment.put("contentType", "application/vnd.microsoft.card.adaptive");
        attachment.put("contentUrl", null);

        Map<String, Object> card = new HashMap<>();
        card.put("$schema", "http://adaptivecards.io/schemas/adaptive-card.json");
        card.put("type", "AdaptiveCard");
        card.put("version", "1.4");

        Map<String, Object> textBlock = new HashMap<>();
        textBlock.put("type", "TextBlock");
        textBlock.put("text", message);
        textBlock.put("wrap", true);

        card.put("body", List.of(textBlock));

        attachment.put("content", card);
        teamsMessage.put("attachments", List.of(attachment));

        return teamsMessage;
    }

    /**
     * Returns the Adaptive Card color string for the given priority.
     */
    private String getPriorityColor(Incident.IncidentPriority priority) {
        return switch (priority) {
            case CRITICAL -> "attention";
            case HIGH -> "warning";
            case MEDIUM -> "accent";
            case LOW -> "good";
        };
    }

    /**
     * Returns a text emoji indicator for the given priority.
     */
    private String getPriorityEmoji(Incident.IncidentPriority priority) {
        return switch (priority) {
            case CRITICAL -> "🔴 ";  // red circle
            case HIGH -> "🔶 ";      // orange diamond
            case MEDIUM -> "🟡 ";    // yellow circle
            case LOW -> "🟢 ";       // green circle
        };
    }

    /**
     * Formats a Duration into a human-readable string (e.g., "2h 15m").
     */
    private String formatDuration(Duration duration) {
        long hours = duration.toHours();
        long minutes = duration.toMinutesPart();
        long seconds = duration.toSecondsPart();

        if (hours > 0) {
            return hours + "h " + minutes + "m";
        } else if (minutes > 0) {
            return minutes + "m " + seconds + "s";
        } else {
            return seconds + "s";
        }
    }
}
