package com.orionops.modules.integration.monitoring;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@ConditionalOnProperty(name = "orionops.monitoring.enabled", havingValue = "true")
@RequiredArgsConstructor
public class MonitoringIntegrationService {

    private final ObjectMapper objectMapper;
    private Map<String, Object> alertMapping;

    @EventListener(ApplicationReadyEvent.class)
    public void loadAlertMapping() {
        try {
            alertMapping = new HashMap<>();
            log.info("Monitoring integration service initialized");
        } catch (Exception e) {
            log.warn("Failed to load alert mapping: {}", e.getMessage());
            alertMapping = new HashMap<>();
        }
    }

    public void processMonitoringAlert(String alertPayload) {
        log.info("Processing monitoring alert");
        try {
            String alertType = detectAlertType(alertPayload);
            log.info("Detected alert type: {}", alertType);
        } catch (Exception e) {
            log.error("Failed to process monitoring alert: {}", e.getMessage(), e);
        }
    }

    public Object ingestAlert(java.util.Map<String, Object> alertData) {
        log.info("Ingesting monitoring alert");
        try {
            String alertType = detectAlertType(alertData);
            log.info("Processing alert of type: {}", alertType);

            // Create incident from alert
            Map<String, Object> incidentData = new HashMap<>();
            incidentData.put("id", java.util.UUID.randomUUID());
            incidentData.put("title", alertData.getOrDefault("alert", "Monitoring Alert"));
            incidentData.put("status", "OPEN");
            incidentData.put("source", "monitoring");

            return incidentData;
        } catch (Exception e) {
            log.error("Failed to ingest alert: {}", e.getMessage(), e);
            return Map.of("status", "error", "message", e.getMessage());
        }
    }

    private String detectAlertType(String json) {
        try {
            JsonNode node = objectMapper.readTree(json);
            if (node.has("alerts")) {
                return "prometheus";
            } else if (node.has("alert")) {
                return "datadog";
            } else if (node.has("events")) {
                return "newrelic";
            }
        } catch (IOException e) {
            log.debug("Could not parse JSON: {}", e.getMessage());
        }
        return "generic";
    }

    private String detectAlertType(Map<String, Object> alertData) {
        if (alertData.containsKey("alerts")) {
            return "prometheus";
        } else if (alertData.containsKey("alert")) {
            return "datadog";
        } else if (alertData.containsKey("events")) {
            return "newrelic";
        }
        return "generic";
    }
}
