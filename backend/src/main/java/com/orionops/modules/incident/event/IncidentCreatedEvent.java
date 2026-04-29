package com.orionops.modules.incident.event;

import com.orionops.common.event.BaseEvent;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

/**
 * Event emitted when a new incident is created.
 * Contains the incident details needed by read model projections
 * and downstream consumers (notification, SLA, audit).
 */
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class IncidentCreatedEvent extends BaseEvent {

    @Builder.Default
    private final String eventType = "INCIDENT_CREATED";
    @Builder.Default
    private final String aggregateType = "incident";

    private UUID incidentId;
    private String title;
    private String priority;
    private String category;
    private UUID serviceId;
    private UUID reporterId;
    private UUID assigneeId;
}
