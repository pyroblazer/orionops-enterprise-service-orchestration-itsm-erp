package com.orionops.common.event;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Immutable record representing a domain event persisted in the event store.
 * Used for event sourcing and audit trail reconstruction.
 *
 * @param aggregateType the type of aggregate (e.g., "incident", "change_request")
 * @param aggregateId   the unique identifier of the aggregate
 * @param eventType     the type of event (e.g., "CREATED", "ASSIGNED")
 * @param payload       the event payload as a JSON node for flexible schema support
 * @param metadata      optional metadata map for correlation and tracing
 * @param timestamp     when the event occurred
 */
public record DomainEvent(
        String aggregateType,
        UUID aggregateId,
        String eventType,
        JsonNode payload,
        Map<String, Object> metadata,
        LocalDateTime timestamp
) {
}
