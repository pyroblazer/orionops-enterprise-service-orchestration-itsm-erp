package com.orionops.modules.change.event;

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
public class ChangeApprovedEvent extends BaseEvent {

    private final String eventType = "CHANGE_APPROVED";
    private final String aggregateType = "change_request";

    private UUID changeId;
    private UUID approvedBy;
}
