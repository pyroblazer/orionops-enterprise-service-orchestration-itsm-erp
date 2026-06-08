package com.orionops.modules.integration.chat;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "orionops.chat.enabled", havingValue = "true")
public class SlackIntegrationService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${orionops.integrations.slack.webhook-url:}")
    private String defaultWebhookUrl;

    @Value("${orionops.integrations.slack.enabled:false}")
    private boolean slackEnabled;

    @Value("${orionops.platform.base-url:http://localhost:3000}")
    private String platformBaseUrl;

    public void sendNotification(String channel, String message) {
        if (!slackEnabled) {
            log.warn("Slack integration is disabled");
            return;
        }

        try {
            String webhookUrl = defaultWebhookUrl;
            if (webhookUrl == null || webhookUrl.isBlank()) {
                log.warn("Slack webhook URL not configured");
                return;
            }

            Map<String, Object> payload = new HashMap<>();
            payload.put("text", message);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> request = new HttpEntity<>(objectMapper.writeValueAsString(payload), headers);

            restTemplate.postForObject(webhookUrl, request, String.class);
            log.info("Slack notification sent to {}", channel);
        } catch (Exception e) {
            log.warn("Failed to send Slack notification: {}", e.getMessage());
        }
    }

    public void sendBlockNotification(String channel, List<Map<String, Object>> blocks) {
        if (!slackEnabled) {
            log.warn("Slack integration is disabled");
            return;
        }

        try {
            String webhookUrl = defaultWebhookUrl;
            if (webhookUrl == null || webhookUrl.isBlank()) {
                log.warn("Slack webhook URL not configured");
                return;
            }

            Map<String, Object> payload = new HashMap<>();
            payload.put("blocks", blocks);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> request = new HttpEntity<>(objectMapper.writeValueAsString(payload), headers);

            restTemplate.postForObject(webhookUrl, request, String.class);
            log.info("Slack block notification sent to {}", channel);
        } catch (Exception e) {
            log.warn("Failed to send Slack block notification: {}", e.getMessage());
        }
    }

    public List<Map<String, Object>> formatIncidentMessage(Map<String, Object> incident) {
        List<Map<String, Object>> blocks = new java.util.ArrayList<>();

        Map<String, Object> headerBlock = Map.of(
                "type", "header",
                "text", Map.of(
                        "type", "plain_text",
                        "text", "🚨 Incident: " + incident.get("title"),
                        "emoji", true
                )
        );
        blocks.add(headerBlock);

        StringBuilder statusText = new StringBuilder();
        statusText.append("*Status:* ").append(incident.get("status")).append("\n");
        statusText.append("*Priority:* ").append(incident.get("priority")).append("\n");
        statusText.append("*Category:* ").append(incident.getOrDefault("category", "Uncategorized")).append("\n");

        if (incident.get("description") != null) {
            String desc = incident.get("description").toString();
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

        blocks.add(Map.of("type", "divider"));

        String incidentUrl = platformBaseUrl + "/incidents/" + incident.get("id");
        Map<String, Object> actionsBlock = Map.of(
                "type", "actions",
                "elements", List.of(
                        Map.of(
                                "type", "button",
                                "text", Map.of("type", "plain_text", "text", "View Incident", "emoji", true),
                                "url", incidentUrl,
                                "action_id", "view_incident_" + incident.get("id")
                        )
                )
        );
        blocks.add(actionsBlock);

        return blocks;
    }

    public List<Map<String, Object>> formatChangeApprovalMessage(Map<String, Object> change) {
        List<Map<String, Object>> blocks = new java.util.ArrayList<>();

        Map<String, Object> headerBlock = Map.of(
                "type", "header",
                "text", Map.of(
                        "type", "plain_text",
                        "text", "📋 Change Approval: " + change.get("title"),
                        "emoji", true
                )
        );
        blocks.add(headerBlock);

        StringBuilder detailsText = new StringBuilder();
        detailsText.append("*Status:* ").append(change.get("status")).append("\n");
        detailsText.append("*Change Type:* ").append(change.getOrDefault("changeType", "Normal")).append("\n");
        if (change.get("description") != null) {
            detailsText.append("*Description:* ").append(change.get("description")).append("\n");
        }

        Map<String, Object> sectionBlock = Map.of(
                "type", "section",
                "text", Map.of(
                        "type", "mrkdwn",
                        "text", detailsText.toString()
                )
        );
        blocks.add(sectionBlock);

        blocks.add(Map.of("type", "divider"));

        return blocks;
    }
}
