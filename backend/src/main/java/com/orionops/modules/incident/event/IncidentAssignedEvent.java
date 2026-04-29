package com.orionops.modules.incident.event;

import com.orionops.common.event.BaseEvent;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

/**
 * Event emitted when an incident is assigned to a user or group.
 */
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class IncidentAssignedEvent extends BaseEvent {

    @Builder.Default
    private final String eventType = "INCIDENT_ASSIGNED";
    @Builder.Default
    private final String aggregateType = "incident";

    private UUID incidentId;
    private UUID assigneeId;
    private UUID assigneeGroupId;
    private String assignedBy;
}
