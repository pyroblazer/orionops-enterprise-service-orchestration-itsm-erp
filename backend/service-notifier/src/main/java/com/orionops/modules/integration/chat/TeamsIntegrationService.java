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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "orionops.chat.enabled", havingValue = "true")
public class TeamsIntegrationService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${orionops.integrations.teams.webhook-url:}")
    private String defaultWebhookUrl;

    @Value("${orionops.integrations.teams.enabled:false}")
    private boolean teamsEnabled;

    @Value("${orionops.platform.base-url:http://localhost:3000}")
    private String platformBaseUrl;

    public void sendNotification(String webhookUrl, String message) {
        if (!teamsEnabled) {
            log.warn("Teams integration is disabled");
            return;
        }

        try {
            String url = (webhookUrl != null && !webhookUrl.isBlank()) ? webhookUrl : defaultWebhookUrl;
            if (url == null || url.isBlank()) {
                log.warn("Teams webhook URL not configured");
                return;
            }

            Map<String, Object> card = createSimpleCard(message);
            sendAdaptiveCard(url, card);
        } catch (Exception e) {
            log.warn("Failed to send Teams notification: {}", e.getMessage());
        }
    }

    public void sendAdaptiveCardNotification(String webhookUrl, Map<String, Object> adaptiveCard) {
        if (!teamsEnabled) {
            log.warn("Teams integration is disabled");
            return;
        }

        try {
            String url = (webhookUrl != null && !webhookUrl.isBlank()) ? webhookUrl : defaultWebhookUrl;
            if (url == null || url.isBlank()) {
                log.warn("Teams webhook URL not configured");
                return;
            }

            sendAdaptiveCard(url, adaptiveCard);
        } catch (Exception e) {
            log.warn("Failed to send Teams adaptive card: {}", e.getMessage());
        }
    }

    public Map<String, Object> formatAdaptiveCard(Map<String, Object> incident) {
        Map<String, Object> message = new HashMap<>();
        message.put("type", "message");

        Map<String, Object> attachment = new HashMap<>();
        attachment.put("contentType", "application/vnd.microsoft.card.adaptive");
        attachment.put("contentUrl", null);

        Map<String, Object> card = new HashMap<>();
        card.put("$schema", "http://adaptivecards.io/schemas/adaptive-card.json");
        card.put("type", "AdaptiveCard");
        card.put("version", "1.4");

        List<Map<String, Object>> body = new ArrayList<>();

        Map<String, Object> titleContainer = new HashMap<>();
        titleContainer.put("type", "Container");
        titleContainer.put("style", "emphasis");
        titleContainer.put("bleed", true);

        List<Map<String, Object>> titleItems = new ArrayList<>();
        Map<String, Object> titleBlock = new HashMap<>();
        titleBlock.put("type", "TextBlock");
        titleBlock.put("text", "🚨 Incident Alert");
        titleBlock.put("size", "Large");
        titleBlock.put("weight", "Bolder");
        titleBlock.put("color", "attention");
        titleItems.add(titleBlock);

        Map<String, Object> subtitleBlock = new HashMap<>();
        subtitleBlock.put("type", "TextBlock");
        subtitleBlock.put("text", incident.get("title"));
        subtitleBlock.put("size", "Medium");
        subtitleBlock.put("wrap", true);
        titleItems.add(subtitleBlock);

        titleContainer.put("items", titleItems);
        body.add(titleContainer);

        Map<String, Object> factSet = new HashMap<>();
        factSet.put("type", "FactSet");
        List<Map<String, String>> facts = new ArrayList<>();

        facts.add(Map.of("title", "Status", "value", incident.getOrDefault("status", "Unknown").toString()));
        facts.add(Map.of("title", "Priority", "value", incident.getOrDefault("priority", "Unknown").toString()));
        facts.add(Map.of("title", "Category", "value", incident.getOrDefault("category", "Uncategorized").toString()));

        if (incident.get("impact") != null) {
            facts.add(Map.of("title", "Impact", "value", incident.get("impact").toString()));
        }

        factSet.put("facts", facts);
        body.add(factSet);

        card.put("body", body);

        List<Map<String, Object>> actions = new ArrayList<>();
        Map<String, Object> viewAction = new HashMap<>();
        viewAction.put("type", "Action.OpenUrl");
        viewAction.put("title", "View Incident");
        viewAction.put("url", platformBaseUrl + "/incidents/" + incident.get("id"));
        actions.add(viewAction);
        card.put("actions", actions);

        attachment.put("content", card);

        message.put("attachments", List.of(attachment));
        return message;
    }

    private Map<String, Object> createSimpleCard(String message) {
        Map<String, Object> card = new HashMap<>();
        card.put("type", "message");
        card.put("text", message);
        return card;
    }

    private void sendAdaptiveCard(String webhookUrl, Map<String, Object> card) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> request = new HttpEntity<>(objectMapper.writeValueAsString(card), headers);

            restTemplate.postForObject(webhookUrl, request, String.class);
            log.info("Teams adaptive card sent");
        } catch (Exception e) {
            log.warn("Failed to send Teams adaptive card: {}", e.getMessage());
        }
    }
}
