package com.orionops.modules.incident.event;

import com.orionops.common.event.BaseEvent;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

/**
 * Event emitted when an incident is escalated to a higher support tier.
 */
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class IncidentEscalatedEvent extends BaseEvent {

    private final String eventType = "INCIDENT_ESCALATED";
    private final String aggregateType = "incident";

    private UUID incidentId;
    private int escalationLevel;
    private String escalationReason;
    private UUID escalatedBy;
    private UUID newAssigneeId;
}
