package com.orionops.modules.integration.consumers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orionops.common.event.IncidentEventPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@ConditionalOnProperty(name = "orionops.consumer.incident.enabled", havingValue = "true")
@RequiredArgsConstructor
public class IncidentEventConsumer {

    private final ObjectMapper objectMapper;

    @KafkaListener(topicPattern = "orionops\\.incident\\..*",
            groupId = "${spring.kafka.consumer.group-id}-incident-consumer")
    public void consumeIncidentEvent(org.apache.kafka.clients.consumer.ConsumerRecord<String, String> message) {
        String topic = message.topic();
        String value = message.value();
        String eventType = extractEventType(value);

        log.info("Received incident event: topic={}, eventType={}, key={}",
                topic, eventType, message.key());

        try {
            switch (eventType) {
                case "INCIDENT_CREATED" -> handleIncidentCreated(value);
                case "INCIDENT_ASSIGNED" -> handleIncidentAssigned(value);
                case "INCIDENT_ESCALATED" -> handleIncidentEscalated(value);
                case "INCIDENT_RESOLVED" -> handleIncidentResolved(value);
                default -> log.warn("Unknown incident event type: {}", eventType);
            }
        } catch (Exception e) {
            log.error("Failed to process incident event [type={}, topic={}]: {}",
                    eventType, topic, e.getMessage(), e);
        }
    }

    private void handleIncidentCreated(String eventJson) throws Exception {
        IncidentEventPayload event = objectMapper.readValue(eventJson, IncidentEventPayload.class);
        log.info("Processing INCIDENT_CREATED: incidentId={}, title={}, assigneeId={}",
                event.getIncidentId(), event.getTitle(), event.getAssigneeId());
        // Event is indexed by async indexing service if needed
    }

    private void handleIncidentAssigned(String eventJson) throws Exception {
        IncidentEventPayload event = objectMapper.readValue(eventJson, IncidentEventPayload.class);
        log.info("Processing INCIDENT_ASSIGNED: incidentId={}, assigneeId={}",
                event.getIncidentId(), event.getAssigneeId());
    }

    private void handleIncidentEscalated(String eventJson) throws Exception {
        IncidentEventPayload event = objectMapper.readValue(eventJson, IncidentEventPayload.class);
        log.info("Processing INCIDENT_ESCALATED: incidentId={}, level={}, reason={}",
                event.getIncidentId(), event.getEscalationLevel(), event.getEscalationReason());
    }

    private void handleIncidentResolved(String eventJson) throws Exception {
        IncidentEventPayload event = objectMapper.readValue(eventJson, IncidentEventPayload.class);
        log.info("Processing INCIDENT_RESOLVED: incidentId={}, resolvedBy={}",
                event.getIncidentId(), event.getResolvedBy());
    }

    private String extractEventType(String json) {
        try {
            var node = objectMapper.readTree(json);
            if (node.has("eventType")) {
                return node.get("eventType").asText();
            }
        } catch (Exception e) {
            log.warn("Failed to extract eventType from JSON: {}", e.getMessage());
        }
        return "UNKNOWN";
    }
}
