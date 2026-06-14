package com.orionops.common.event;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Abstract base class for all domain events in the platform.
 * Events represent meaningful state changes in the domain model
 * and are published to Kafka for asynchronous processing and audit trails.
 *
 * <p>Each event carries metadata about what changed (aggregateType, aggregateId),
 * when it changed (timestamp), and optional contextual information (metadata).</p>
 */
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "eventType")
public abstract class BaseEvent {

    private UUID eventId = UUID.randomUUID();
    private String eventType;
    private String aggregateType;
    private UUID aggregateId;
    private LocalDateTime timestamp = LocalDateTime.now();
    private Map<String, Object> metadata = new HashMap<>();
}
