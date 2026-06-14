package com.orionops.common.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SLAEventPayload {
    private UUID slaInstanceId;
    private UUID targetEntityId;
    private String targetType;
    private String breachType;
}
