package com.orionops.common.event;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

/**
 * Publishes domain events to Kafka topics.
 * Events are serialized to JSON and sent to topic names derived from the aggregate type.
 * For example, IncidentCreatedEvent with aggregateType "incident" goes to topic "orionops.incident.events".
 *
 * <p>This component is central to the event-driven architecture and enables
 * CQRS read model projections, audit logging, and cross-module integration.</p>
 */
@Slf4j
@Component
public class EventPublisher {

    private static final String TOPIC_PREFIX = "orionops.";
    private static final String TOPIC_SUFFIX = ".events";

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public EventPublisher(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    /**
     * Publishes a domain event to the appropriate Kafka topic.
     * The topic name is derived from the event's aggregateType.
     *
     * @param event the domain event to publish
     */
    public void publish(BaseEvent event) {
        try {
            String topic = TOPIC_PREFIX + event.getAggregateType() + TOPIC_SUFFIX;
            String payload = objectMapper.writeValueAsString(event);
            String key = event.getAggregateId().toString();

            kafkaTemplate.send(topic, key, payload)
                    .whenComplete((result, ex -> {
                        if (ex != null) {
                            log.error("Failed to publish event {} to topic {}: {}",
                                    event.getEventId(), topic, ex.getMessage(), ex);
                        } else {
                            log.info("Published event {} [type={}] to topic {} for aggregate {}",
                                    event.getEventId(), event.getEventType(), topic,
                                    event.getAggregateId());
                        }
                    }));
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize event {}: {}", event.getEventId(), e.getMessage(), e);
            throw new RuntimeException("Event serialization failed", e);
        }
    }
}
