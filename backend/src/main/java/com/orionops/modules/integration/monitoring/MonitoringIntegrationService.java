package com.orionops.modules.integration.monitoring;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.orionops.modules.incident.dto.CreateIncidentRequest;
import com.orionops.modules.incident.entity.Incident;
import com.orionops.modules.incident.service.IncidentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service for integrating with external monitoring systems.
 *
 * <p>Accepts alert payloads from Prometheus Alertmanager, Datadog, and New Relic
 * webhook integrations, normalizes the alert data, and automatically creates
 * incidents from incoming monitoring alerts. Alert-to-incident mapping is
 * configured via alert-mapping.yml.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MonitoringIntegrationService {

    private final IncidentService incidentService;
    private final ObjectMapper objectMapper;

    private Map<String, Object> alertMapping;

    /**
     * Loads alert mapping configuration from alert-mapping.yml after application startup.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void loadAlertMapping() {
        try {
            ClassPathResource resource = new ClassPathResource("alert-mapping.yml");
            if (resource.exists()) {
                try (InputStream is = resource.getInputStream()) {
                    org.yaml.snakeyaml.Yaml yaml = new org.yaml.snakeyaml.Yaml();
                    alertMapping = yaml.load(is);
                    log.info("Alert mapping configuration loaded successfully");
                }
            } else {
                log.warn("alert-mapping.yml not found, using default mappings");
                alertMapping = buildDefaultMapping();
            }
        } catch (IOException e) {
            log.error("Failed to load alert mapping: {}", e.getMessage());
            alertMapping = buildDefaultMapping();
        }
    }

    /**
     * Ingests a monitoring alert and creates an incident.
     *
     * <p>Automatically detects the alert source format (Alertmanager, Datadog, New Relic)
     * based on the payload structure and parses accordingly.</p>
     *
     * @param alertPayload the raw alert payload from the monitoring system
     * @return the created incident response
     */
    public Object ingestAlert(Map<String, Object> alertPayload) {
        log.info("Ingesting monitoring alert: keys={}", alertPayload.keySet());

        String source = detectAlertSource(alertPayload);
        log.info("Detected alert source: {}", source);

        ParsedAlert parsedAlert = switch (source) {
            case "alertmanager" -> parseAlertmanagerAlert(alertPayload);
            case "datadog" -> parseDatadogAlert(alertPayload);
            case "newrelic" -> parseNewRelicAlert(alertPayload);
            default -> parseGenericAlert(alertPayload);
        };

        CreateIncidentRequest incidentRequest = parseAlertToIncident(parsedAlert);
        Object response = incidentService.createIncident(incidentRequest);

        log.info("Incident created from {} alert: title={}", source, parsedAlert.getTitle());
        return response;
    }

    /**
     * Parses a normalized alert into an incident creation request.
     * Maps alert fields to incident fields using the configured mapping.
     */
    private CreateIncidentRequest parseAlertToIncident(ParsedAlert alert) {
        Incident.IncidentPriority priority = mapSeverityToPriority(alert.getSeverity());

        return CreateIncidentRequest.builder()
                .title(truncate(alert.getTitle(), 255))
                .description(formatAlertDescription(alert))
                .priority(priority)
                .category(mapCategory(alert.getLabels()))
                .subcategory(mapSubcategory(alert.getLabels()))
                .serviceId(resolveServiceId(alert.getLabels()))
                .ciId(resolveCiId(alert.getLabels()))
                .build();
    }

    /**
     * Parses a Prometheus Alertmanager webhook payload.
     * Alertmanager sends alerts in a specific format with status, alerts array,
     * and grouped labels/annotations.
     */
    private ParsedAlert parseAlertmanagerAlert(Map<String, Object> payload) {
        ParsedAlert alert = new ParsedAlert();
        alert.setSource("alertmanager");

        String status = (String) payload.getOrDefault("status", "firing");
        alert.setStatus(status);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> alerts = (List<Map<String, Object>>) payload.get("alerts");
        if (alerts != null && !alerts.isEmpty()) {
            Map<String, Object> firstAlert = alerts.get(0);

            @SuppressWarnings("unchecked")
            Map<String, String> annotations = (Map<String, String>) firstAlert.get("annotations");
            @SuppressWarnings("unchecked")
            Map<String, String> labels = (Map<String, String>) firstAlert.get("labels");

            if (labels != null) {
                alert.setTitle(labels.getOrDefault("alertname", "Prometheus Alert"));
                alert.setSeverity(labels.getOrDefault("severity", "warning"));
                alert.setLabels(labels);
            }

            if (annotations != null) {
                alert.setDescription(annotations.getOrDefault("description",
                        annotations.getOrDefault("summary", "No description available")));
                alert.setRunbookUrl(annotations.getOrDefault("runbook_url"));
            }

            alert.setGeneratorUrl((String) firstAlert.get("generatorURL"));
            alert.setStartsAt((String) firstAlert.get("startsAt"));
        }

        // Group labels
        @SuppressWarnings("unchecked")
        Map<String, String> groupLabels = (Map<String, String>) payload.get("groupLabels");
        if (groupLabels != null) {
            alert.getLabels().putAll(groupLabels);
        }

        return alert;
    }

    /**
     * Parses a Datadog webhook alert payload.
     */
    private ParsedAlert parseDatadogAlert(Map<String, Object> payload) {
        ParsedAlert alert = new ParsedAlert();
        alert.setSource("datadog");

        alert.setTitle((String) payload.getOrDefault("title", "Datadog Alert"));
        alert.setDescription((String) payload.getOrDefault("text",
                payload.getOrDefault("body", "No description")));
        alert.setStatus((String) payload.getOrDefault("alert_type", "warning"));
        alert.setSeverity(mapDatadogPriority(payload.get("priority")));
        alert.setGeneratorUrl((String) payload.get("alert_url"));
        alert.setStartsAt((String) payload.get("date"));

        Map<String, String> labels = new HashMap<>();
        labels.put("monitor_id", String.valueOf(payload.getOrDefault("id", "")));
        labels.put("monitor_name", (String) payload.getOrDefault("monitor_name", ""));
        if (payload.get("host") != null) {
            labels.put("host", String.valueOf(payload.get("host")));
        }
        alert.setLabels(labels);

        return alert;
    }

    /**
     * Parses a New Relic webhook alert payload.
     */
    private ParsedAlert parseNewRelicAlert(Map<String, Object> payload) {
        ParsedAlert alert = new ParsedAlert();
        alert.setSource("newrelic");

        @SuppressWarnings("unchecked")
        Map<String, Object> issue = (Map<String, Object>) payload.get("issue");
        if (issue != null) {
            alert.setTitle((String) issue.getOrDefault("title", "New Relic Alert"));
            alert.setDescription((String) issue.getOrDefault("description",
                    issue.getOrDefault("subtitle", "No description")));

            @SuppressWarnings("unchecked")
            List<String> severities = (List<String>) issue.get("severity");
            if (severities != null && !severities.isEmpty()) {
                alert.setSeverity(severities.get(0).toLowerCase());
            }

            Map<String, String> labels = new HashMap<>();
            labels.put("issue_id", (String) issue.getOrDefault("issueId", ""));
            labels.put("account_id", String.valueOf(issue.getOrDefault("accountId", "")));
            alert.setLabels(labels);

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> violations = (List<Map<String, Object>>) issue.get("violations");
            if (violations != null && !violations.isEmpty()) {
                Map<String, Object> violation = violations.get(0);
                alert.setStartsAt((String) violation.get("openedAt"));
            }
        } else {
            alert.setTitle("New Relic Alert");
            alert.setDescription(payload.toString());
        }

        return alert;
    }

    /**
     * Parses a generic/unknown alert format.
     */
    private ParsedAlert parseGenericAlert(Map<String, Object> payload) {
        ParsedAlert alert = new ParsedAlert();
        alert.setSource("generic");
        alert.setTitle((String) payload.getOrDefault("title",
                payload.getOrDefault("name", payload.getOrDefault("alert_name", "Unknown Alert"))));
        alert.setDescription((String) payload.getOrDefault("description",
                payload.getOrDefault("message",
                        payload.getOrDefault("text", "No description available"))));
        alert.setSeverity((String) payload.getOrDefault("severity",
                payload.getOrDefault("priority", "warning")));
        alert.setStatus((String) payload.getOrDefault("status", "firing"));

        Map<String, String> labels = new HashMap<>();
        payload.forEach((k, v) -> labels.put(k, String.valueOf(v)));
        alert.setLabels(labels);

        return alert;
    }

    /**
     * Detects the alert source format based on payload structure.
     */
    private String detectAlertSource(Map<String, Object> payload) {
        if (payload.containsKey("alerts") && payload.containsKey("status")
                && payload.containsKey("groupLabels")) {
            return "alertmanager";
        }
        if (payload.containsKey("alert_type") || payload.containsKey("monitor_name")
                || payload.containsKey("datadog")) {
            return "datadog";
        }
        if (payload.containsKey("issue") || payload.containsKey("deployment")
                || payload.containsKey("nr_account_id")) {
            return "newrelic";
        }
        return "generic";
    }

    private Incident.IncidentPriority mapSeverityToPriority(String severity) {
        if (severity == null) return Incident.IncidentPriority.MEDIUM;
        return switch (severity.toLowerCase()) {
            case "critical", "crit", "p1", "sev1" -> Incident.IncidentPriority.CRITICAL;
            case "high", "error", "p2", "sev2" -> Incident.IncidentPriority.HIGH;
            case "low", "info", "p4", "sev4" -> Incident.IncidentPriority.LOW;
            default -> Incident.IncidentPriority.MEDIUM;
        };
    }

    private String mapDatadogPriority(Object priority) {
        if (priority == null) return "warning";
        return switch (String.valueOf(priority).toLowerCase()) {
            case "p1", "critical" -> "critical";
            case "p2", "high" -> "high";
            case "p4", "low" -> "low";
            default -> "warning";
        };
    }

    private String mapCategory(Map<String, String> labels) {
        if (labels == null) return "monitoring";
        if (labels.containsKey("service")) return "service";
        if (labels.containsKey("host") || labels.containsKey("instance")) return "infrastructure";
        if (labels.containsKey("job")) return "application";
        return "monitoring";
    }

    private String mapSubcategory(Map<String, String> labels) {
        if (labels == null) return null;
        return labels.getOrDefault("alertname", labels.getOrDefault("monitor_name", "monitoring_alert"));
    }

    private UUID resolveServiceId(Map<String, String> labels) {
        // In production, this would look up the service by name from the CMDB
        return null;
    }

    private UUID resolveCiId(Map<String, String> labels) {
        // In production, this would look up the CI by hostname/instance from the CMDB
        return null;
    }

    private String formatAlertDescription(ParsedAlert alert) {
        StringBuilder sb = new StringBuilder();
        sb.append("Alert Source: ").append(alert.getSource()).append("\n\n");
        sb.append(alert.getDescription()).append("\n\n");

        if (alert.getStatus() != null) {
            sb.append("Status: ").append(alert.getStatus()).append("\n");
        }
        if (alert.getSeverity() != null) {
            sb.append("Severity: ").append(alert.getSeverity()).append("\n");
        }
        if (alert.getStartsAt() != null) {
            sb.append("Started At: ").append(alert.getStartsAt()).append("\n");
        }
        if (alert.getGeneratorUrl() != null) {
            sb.append("Source URL: ").append(alert.getGeneratorUrl()).append("\n");
        }

        if (alert.getLabels() != null && !alert.getLabels().isEmpty()) {
            sb.append("\nLabels:\n");
            alert.getLabels().forEach((k, v) -> sb.append("  ").append(k).append(": ").append(v).append("\n"));
        }

        return sb.toString();
    }

    private String truncate(String value, int maxLength) {
        if (value == null) return "Monitoring Alert";
        return value.length() > maxLength ? value.substring(0, maxLength) : value;
    }

    private Map<String, Object> buildDefaultMapping() {
        Map<String, Object> mapping = new HashMap<>();
        Map<String, String> severityMap = new HashMap<>();
        severityMap.put("critical", "CRITICAL");
        severityMap.put("high", "HIGH");
        severityMap.put("warning", "MEDIUM");
        severityMap.put("info", "LOW");
        mapping.put("severity-mapping", severityMap);
        return mapping;
    }

    /**
     * Internal DTO representing a normalized monitoring alert.
     */
    @lombok.Data
    public static class ParsedAlert {
        private String source;
        private String title;
        private String description;
        private String severity;
        private String status;
        private String startsAt;
        private String generatorUrl;
        private String runbookUrl;
        @lombok.Default
        private Map<String, String> labels = new HashMap<>();
    }
}
