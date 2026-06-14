package com.orionops.modules.incident.event;

import com.orionops.common.event.BaseEvent;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

/**
 * Event emitted when an incident is resolved.
 */
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class IncidentResolvedEvent extends BaseEvent {

    private final String eventType = "INCIDENT_RESOLVED";
    private final String aggregateType = "incident";

    private UUID incidentId;
    private UUID resolvedBy;
    private String resolution;
    private String resolutionCode;
}
