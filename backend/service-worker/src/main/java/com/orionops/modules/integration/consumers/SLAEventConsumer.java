package com.orionops.modules.integration.consumers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orionops.common.event.SLAEventPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@ConditionalOnProperty(name = "orionops.consumer.sla.enabled", havingValue = "true")
@RequiredArgsConstructor
public class SLAEventConsumer {

    private final ObjectMapper objectMapper;

    @KafkaListener(topicPattern = "orionops\\.sla\\..*",
            groupId = "${spring.kafka.consumer.group-id}-sla-consumer")
    public void consumeSLAEvent(org.apache.kafka.clients.consumer.ConsumerRecord<String, String> message) {
        String topic = message.topic();
        String value = message.value();
        String eventType = extractEventType(value);

        log.info("Received SLA event: topic={}, eventType={}, key={}",
                topic, eventType, message.key());

        try {
            switch (eventType) {
                case "SLA_BREACHED" -> handleSLABreach(value);
                case "SLA_CREATED" -> handleSLACreated(value);
                default -> log.warn("Unknown SLA event type: {}", eventType);
            }
        } catch (Exception e) {
            log.error("Failed to process SLA event [type={}, topic={}]: {}",
                    eventType, topic, e.getMessage(), e);
        }
    }

    private void handleSLABreach(String eventJson) throws Exception {
        SLAEventPayload event = objectMapper.readValue(eventJson, SLAEventPayload.class);
        log.warn("Processing SLA_BREACHED: slaInstanceId={}, targetEntityId={}, breachType={}",
                event.getSlaInstanceId(), event.getTargetEntityId(), event.getBreachType());
    }

    private void handleSLACreated(String eventJson) throws Exception {
        SLAEventPayload event = objectMapper.readValue(eventJson, SLAEventPayload.class);
        log.info("SLA_CREATED: slaInstanceId={}, targetEntityId={}, targetType={}",
                event.getSlaInstanceId(), event.getTargetEntityId(), event.getTargetType());
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
