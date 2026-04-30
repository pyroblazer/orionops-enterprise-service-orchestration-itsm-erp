package com.orionops.common.event;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Publishes domain events to Kafka topics.
 *
 * <p>Events are serialized to JSON and sent to topic names derived from the aggregate type.
 * When called within an active transaction, Kafka sends are deferred until after the
 * transaction commits successfully. This prevents phantom events from being published
 * if the database transaction rolls back after the Kafka send succeeds.</p>
 *
 * <p>When called outside a transaction, events are published immediately.</p>
 */
@Slf4j
@Component
public class EventPublisher {

    private static final String TOPIC_PREFIX = "orionops.";
    private static final String TOPIC_SUFFIX = ".events";

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public EventPublisher(@Qualifier("stringKafkaTemplate") KafkaTemplate<String, String> kafkaTemplate, ObjectMapper springObjectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = springObjectMapper.copy().registerModule(new JavaTimeModule());
    }

    /**
     * Publishes a domain event to the appropriate Kafka topic.
     * If called within an active transaction, the send is deferred until after commit.
     *
     * @param event the domain event to publish
     */
    public void publish(BaseEvent event) {
        try {
            String topic = TOPIC_PREFIX + event.getAggregateType() + TOPIC_SUFFIX;
            String payload = objectMapper.writeValueAsString(event);
            String key = event.getAggregateId().toString();

            if (TransactionSynchronizationManager.isSynchronizationActive()) {
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        sendToKafka(topic, key, payload, event);
                    }
                });
            } else {
                sendToKafka(topic, key, payload, event);
            }
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize event {}: {}", event.getEventId(), e.getMessage(), e);
            throw new RuntimeException("Event serialization failed", e);
        }
    }

    private void sendToKafka(String topic, String key, String payload, BaseEvent event) {
        kafkaTemplate.send(topic, key, payload)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish event {} to topic {}: {}",
                                event.getEventId(), topic, ex.getMessage(), ex);
                    } else {
                        log.info("Published event {} [type={}] to topic {} for aggregate {}",
                                event.getEventId(), event.getEventType(), topic,
                                event.getAggregateId());
                    }
                });
    }
}
