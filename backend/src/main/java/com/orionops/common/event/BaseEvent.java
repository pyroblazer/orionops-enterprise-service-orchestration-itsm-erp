package com.orionops.common.event;

import com.fasterxml.jackson.annotation.JsonSubTypes;
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
@JsonSubTypes({
        @JsonSubTypes.Type(value = com.orionops.modules.incident.event.IncidentCreatedEvent.class, name = "INCIDENT_CREATED"),
        @JsonSubTypes.Type(value = com.orionops.modules.incident.event.IncidentAssignedEvent.class, name = "INCIDENT_ASSIGNED"),
        @JsonSubTypes.Type(value = com.orionops.modules.incident.event.IncidentResolvedEvent.class, name = "INCIDENT_RESOLVED"),
        @JsonSubTypes.Type(value = com.orionops.modules.incident.event.IncidentEscalatedEvent.class, name = "INCIDENT_ESCALATED"),
        @JsonSubTypes.Type(value = com.orionops.modules.change.event.ChangeSubmittedEvent.class, name = "CHANGE_SUBMITTED"),
        @JsonSubTypes.Type(value = com.orionops.modules.change.event.ChangeApprovedEvent.class, name = "CHANGE_APPROVED"),
        @JsonSubTypes.Type(value = com.orionops.modules.change.event.ChangeRejectedEvent.class, name = "CHANGE_REJECTED"),
        @JsonSubTypes.Type(value = com.orionops.modules.change.event.ChangeImplementedEvent.class, name = "CHANGE_IMPLEMENTED"),
        @JsonSubTypes.Type(value = com.orionops.modules.sla.event.SLABreachEvent.class, name = "SLA_BREACHED"),
        @JsonSubTypes.Type(value = com.orionops.modules.sla.event.SLACreatedEvent.class, name = "SLA_CREATED"),
        @JsonSubTypes.Type(value = com.orionops.modules.billing.event.UsageRecordedEvent.class, name = "USAGE_RECORDED"),
        @JsonSubTypes.Type(value = com.orionops.modules.billing.event.InvoiceGeneratedEvent.class, name = "INVOICE_GENERATED")
})
public abstract class BaseEvent {

    private UUID eventId = UUID.randomUUID();
    private String eventType;
    private String aggregateType;
    private UUID aggregateId;
    private LocalDateTime timestamp = LocalDateTime.now();
    private Map<String, Object> metadata = new HashMap<>();
}
