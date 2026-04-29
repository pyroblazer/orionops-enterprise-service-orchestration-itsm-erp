package com.orionops.modules.integration.chat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orionops.modules.incident.entity.Incident;
import com.orionops.modules.change.entity.ChangeRequest;
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
 * Slack integration service for sending notifications via Slack Incoming Webhooks.
 *
 * <p>Formats incident and change messages using Slack Block Kit for rich,
 * interactive message payloads. Supports both simple text notifications and
 * structured Block Kit messages with actionable buttons.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SlackIntegrationService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${orionops.integrations.slack.webhook-url:}")
    private String defaultWebhookUrl;

    @Value("${orionops.integrations.slack.enabled:false}")
    private boolean slackEnabled;

    @Value("${orionops.platform.base-url:http://localhost:3000}")
    private String platformBaseUrl;

    /**
     * Sends a notification to a Slack channel via Incoming Webhook.
     *
     * @param channel the Slack channel name (e.g., "#incidents") or null to use default webhook
     * @param message the plain text message to send
     */
    public void sendNotification(String channel, String message) {
        if (!slackEnabled) {
            log.warn("Slack integration is disabled. Would have sent to channel={}: {}", channel, message);
            return;
        }

        String webhookUrl = resolveWebhookUrl(channel);
        sendToWebhook(webhookUrl, Map.of("text", message));
    }

    /**
     * Sends a Block Kit formatted notification to a Slack channel.
     *
     * @param channel the Slack channel name or null for default
     * @param blocks  the Block Kit payload as a list of block maps
     */
    public void sendBlockNotification(String channel, List<Map<String, Object>> blocks) {
        if (!slackEnabled) {
            log.warn("Slack integration is disabled. Would have sent Block Kit notification to channel={}", channel);
            return;
        }

        String webhookUrl = resolveWebhookUrl(channel);
        Map<String, Object> payload = new HashMap<>();
        payload.put("blocks", blocks);
        sendToWebhook(webhookUrl, payload);
    }

    /**
     * Formats an incident into a Slack Block Kit message payload.
     *
     * <p>Creates a rich message with:
     * - Header block with priority emoji and incident title
     * - Section block with status, priority, category, and SLA timer
     * - Action block with link to the incident in the platform
     * </p>
     *
     * @param incident the incident entity to format
     * @return list of Block Kit blocks representing the incident
     */
    public List<Map<String, Object>> formatIncidentMessage(Incident incident) {
        List<Map<String, Object>> blocks = new ArrayList<>();

        // Header block
        String priorityEmoji = getPriorityEmoji(incident.getPriority());
        Map<String, Object> headerBlock = Map.of(
                "type", "header",
                "text", Map.of(
                        "type", "plain_text",
                        "text", priorityEmoji + " Incident: " + incident.getTitle(),
                        "emoji", true
                )
        );
        blocks.add(headerBlock);

        // Status and priority section
        StringBuilder statusText = new StringBuilder();
        statusText.append("*Status:* ").append(incident.getStatus().toString()).append("\n");
        statusText.append("*Priority:* ").append(incident.getPriority().toString()).append("\n");
        statusText.append("*Category:* ").append(
                incident.getCategory() != null ? incident.getCategory() : "Uncategorized").append("\n");

        // SLA timer section
        if (incident.getSlaResolutionTarget() != null) {
            Duration remaining = Duration.between(LocalDateTime.now(), incident.getSlaResolutionTarget());
            if (remaining.isNegative()) {
                statusText.append("*SLA:* :warning: BREACHED by ").append(formatDuration(remaining.abs())).append("\n");
            } else {
                statusText.append("*SLA:* ").append(formatDuration(remaining)).append(" remaining\n");
            }
        }

        if (incident.getDescription() != null && !incident.getDescription().isBlank()) {
            String desc = incident.getDescription();
            if (desc.length() > 300) {
                desc = desc.substring(0, 300) + "...";
            }
            statusText.append("\n").append(desc);
        }

        Map<String, Object> sectionBlock = Map.of(
                "type", "section",
                "text", Map.of(
                        "type", "mrkdwn",
                        "text", statusText.toString()
                )
        );
        blocks.add(sectionBlock);

        // Divider
        blocks.add(Map.of("type", "divider"));

        // Action block with link to incident detail
        String incidentUrl = platformBaseUrl + "/incidents/" + incident.getId();
        Map<String, Object> actionsBlock = Map.of(
                "type", "actions",
                "elements", List.of(
                        Map.of(
                                "type", "button",
                                "text", Map.of("type", "plain_text", "text", "View Incident", "emoji", true),
                                "url", incidentUrl,
                                "action_id", "view_incident_" + incident.getId()
                        )
                )
        );
        blocks.add(actionsBlock);

        return blocks;
    }

    /**
     * Formats a change request into a Slack Block Kit message with approve/reject buttons.
     *
     * <p>Creates an interactive message with:
     * - Header block with change type and title
     * - Section block with risk, impact, change type details
     * - Action block with Approve and Reject buttons
     * </p>
     *
     * @param change the change request entity to format
     * @return list of Block Kit blocks with approval actions
     */
    public List<Map<String, Object>> formatChangeApprovalMessage(ChangeRequest change) {
        List<Map<String, Object>> blocks = new ArrayList<>();

        // Header block
        String typeEmoji = getChangeTypeEmoji(change.getChangeType());
        Map<String, Object> headerBlock = Map.of(
                "type", "header",
                "text", Map.of(
                        "type", "plain_text",
                        "text", typeEmoji + " Change Approval: " + change.getTitle(),
                        "emoji", true
                )
        );
        blocks.add(headerBlock);

        // Details section
        StringBuilder detailsText = new StringBuilder();
        detailsText.append("*Change Type:* ").append(change.getChangeType().toString()).append("\n");
        detailsText.append("*Risk Level:* ").append(change.getRisk().toString()).append("\n");
        detailsText.append("*Impact:* ").append(change.getImpact().toString()).append("\n");
        detailsText.append("*Status:* ").append(change.getStatus().toString()).append("\n");

        if (change.getDescription() != null && !change.getDescription().isBlank()) {
            String desc = change.getDescription();
            if (desc.length() > 300) {
                desc = desc.substring(0, 300) + "...";
            }
            detailsText.append("\n").append(desc);
        }

        Map<String, Object> sectionBlock = Map.of(
                "type", "section",
                "text", Map.of(
                        "type", "mrkdwn",
                        "text", detailsText.toString()
                )
        );
        blocks.add(sectionBlock);

        // Implementation timeline
        if (change.getPlannedStart() != null && change.getPlannedEnd() != null) {
            StringBuilder scheduleText = new StringBuilder();
            scheduleText.append("*Planned Start:* ").append(change.getPlannedStart()).append("\n");
            scheduleText.append("*Planned End:* ").append(change.getPlannedEnd()).append("\n");
            Duration duration = Duration.between(change.getPlannedStart(), change.getPlannedEnd());
            scheduleText.append("*Duration:* ").append(formatDuration(duration));

            Map<String, Object> scheduleBlock = Map.of(
                    "type", "section",
                    "text", Map.of(
                            "type", "mrkdwn",
                            "text", scheduleText.toString()
                    )
            );
            blocks.add(scheduleBlock);
        }

        // Divider
        blocks.add(Map.of("type", "divider"));

        // Approve and Reject action buttons
        String changeUrl = platformBaseUrl + "/changes/" + change.getId();
        Map<String, Object> actionsBlock = Map.of(
                "type", "actions",
                "elements", List.of(
                        Map.of(
                                "type", "button",
                                "text", Map.of("type", "plain_text", "text", "Approve", "emoji", true),
                                "style", "primary",
                                "url", changeUrl + "?action=approve",
                                "action_id", "approve_change_" + change.getId(),
                                "value", change.getId().toString()
                        ),
                        Map.of(
                                "type", "button",
                                "text", Map.of("type", "plain_text", "text", "Reject", "emoji", true),
                                "style", "danger",
                                "url", changeUrl + "?action=reject",
                                "action_id", "reject_change_" + change.getId(),
                                "value", change.getId().toString()
                        ),
                        Map.of(
                                "type", "button",
                                "text", Map.of("type", "plain_text", "text", "View Details", "emoji", true),
                                "url", changeUrl,
                                "action_id", "view_change_" + change.getId()
                        )
                )
        );
        blocks.add(actionsBlock);

        return blocks;
    }

    /**
     * Sends an incident notification to the configured Slack channel.
     * Convenience method that combines formatting and sending.
     *
     * @param incident the incident to notify about
     */
    public void sendIncidentNotification(Incident incident) {
        List<Map<String, Object>> blocks = formatIncidentMessage(incident);
        sendBlockNotification("#incidents", blocks);
    }

    /**
     * Sends a change approval notification to the configured Slack channel.
     * Convenience method that combines formatting and sending.
     *
     * @param change the change request requiring approval
     */
    public void sendChangeApprovalNotification(ChangeRequest change) {
        List<Map<String, Object>> blocks = formatChangeApprovalMessage(change);
        sendBlockNotification("#changes", blocks);
    }

    // ---- Private helpers ----

    /**
     * Sends a JSON payload to a Slack webhook URL.
     */
    private void sendToWebhook(String webhookUrl, Map<String, Object> payload) {
        try {
            String jsonBody = objectMapper.writeValueAsString(payload);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> request = new HttpEntity<>(jsonBody, headers);
            String response = restTemplate.postForObject(webhookUrl, request, String.class);

            log.info("Slack notification sent successfully. Response: {}", response);
        } catch (Exception e) {
            log.error("Failed to send Slack notification: {}", e.getMessage(), e);
            throw new RuntimeException("Slack notification delivery failed", e);
        }
    }

    /**
     * Resolves the webhook URL for a given channel.
     * Falls back to the default webhook URL if channel-specific URL is not configured.
     */
    private String resolveWebhookUrl(String channel) {
        // In a production system, this would look up channel-specific webhook URLs
        // from a configuration table. For now, uses the default webhook URL.
        if (defaultWebhookUrl == null || defaultWebhookUrl.isBlank()) {
            throw new IllegalStateException("Slack webhook URL is not configured");
        }
        return defaultWebhookUrl;
    }

    /**
     * Returns a Slack emoji corresponding to the incident priority level.
     */
    private String getPriorityEmoji(Incident.IncidentPriority priority) {
        return switch (priority) {
            case CRITICAL -> ":red_circle:";
            case HIGH -> ":large_orange_diamond:";
            case MEDIUM -> ":large_yellow_circle:";
            case LOW -> ":large_blue_circle:";
        };
    }

    /**
     * Returns a Slack emoji corresponding to the change type.
     */
    private String getChangeTypeEmoji(ChangeRequest.ChangeType changeType) {
        return switch (changeType) {
            case EMERGENCY -> ":rotating_light:";
            case NORMAL -> ":gear:";
            case STANDARD -> ":white_check_mark:";
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
