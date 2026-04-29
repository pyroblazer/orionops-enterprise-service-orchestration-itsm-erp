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
public class ChangeRejectedEvent extends BaseEvent {

    @Builder.Default
    private final String eventType = "CHANGE_REJECTED";
    @Builder.Default
    private final String aggregateType = "change_request";

    private UUID changeId;
    private UUID rejectedBy;
    private String rejectionReason;
}
