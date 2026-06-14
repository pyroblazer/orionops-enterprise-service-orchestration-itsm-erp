package com.orionops.modules.sla.dto;

import com.orionops.modules.sla.entity.SLAInstance;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SLAInstanceResponse {

    private UUID id;
    private UUID slaDefinitionId;
    private UUID targetEntityId;
    private String targetType;
    private SLAInstance.SLAStatus status;
    private LocalDateTime responseTarget;
    private LocalDateTime resolutionTarget;
    private LocalDateTime respondedAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime breachedAt;
    private LocalDateTime createdAt;
}
