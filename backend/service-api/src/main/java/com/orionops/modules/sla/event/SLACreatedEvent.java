package com.orionops.modules.sla.event;

import com.orionops.common.event.BaseEvent;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class SLACreatedEvent extends BaseEvent {

    private final String eventType = "SLA_CREATED";
    private final String aggregateType = "sla_instance";

    private UUID slaInstanceId;
    private UUID targetEntityId;
    private String targetType;
    private UUID slaDefinitionId;
}
