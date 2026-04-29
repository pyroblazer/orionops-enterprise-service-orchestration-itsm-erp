package com.orionops.modules.billing.event;

import com.orionops.common.event.BaseEvent;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class UsageRecordedEvent extends BaseEvent {

    @Builder.Default
    private final String eventType = "USAGE_RECORDED";
    @Builder.Default
    private final String aggregateType = "service_usage";

    private UUID usageId;
    private UUID serviceId;
    private BigDecimal totalCost;
}
