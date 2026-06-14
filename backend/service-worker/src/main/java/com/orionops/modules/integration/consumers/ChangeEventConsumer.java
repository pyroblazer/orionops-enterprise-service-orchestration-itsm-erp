package com.orionops.modules.integration.consumers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orionops.common.event.ChangeEventPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@ConditionalOnProperty(name = "orionops.consumer.change.enabled", havingValue = "true")
@RequiredArgsConstructor
public class ChangeEventConsumer {

    private final ObjectMapper objectMapper;

    @KafkaListener(topicPattern = "orionops\\.change\\..*",
            groupId = "${spring.kafka.consumer.group-id}-change-consumer")
    public void consumeChangeEvent(org.apache.kafka.clients.consumer.ConsumerRecord<String, String> message) {
        String topic = message.topic();
        String value = message.value();
        String eventType = extractEventType(value);

        log.info("Received change event: topic={}, eventType={}, key={}",
                topic, eventType, message.key());

        try {
            switch (eventType) {
                case "CHANGE_APPROVED" -> handleChangeApproved(value);
                case "CHANGE_REJECTED" -> handleChangeRejected(value);
                case "CHANGE_IMPLEMENTED" -> handleChangeImplemented(value);
                default -> log.warn("Unknown change event type: {}", eventType);
            }
        } catch (Exception e) {
            log.error("Failed to process change event [type={}, topic={}]: {}",
                    eventType, topic, e.getMessage(), e);
        }
    }

    private void handleChangeApproved(String eventJson) throws Exception {
        ChangeEventPayload event = objectMapper.readValue(eventJson, ChangeEventPayload.class);
        log.info("Processing CHANGE_APPROVED: changeId={}, approvedBy={}",
                event.getChangeId(), event.getApprovedBy());
    }

    private void handleChangeRejected(String eventJson) throws Exception {
        ChangeEventPayload event = objectMapper.readValue(eventJson, ChangeEventPayload.class);
        log.info("Processing CHANGE_REJECTED: changeId={}, rejectedBy={}, reason={}",
                event.getChangeId(), event.getRejectedBy(), event.getRejectionReason());
    }

    private void handleChangeImplemented(String eventJson) throws Exception {
        ChangeEventPayload event = objectMapper.readValue(eventJson, ChangeEventPayload.class);
        log.info("Processing CHANGE_IMPLEMENTED: changeId={}, implementedBy={}",
                event.getChangeId(), event.getImplementedBy());
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
