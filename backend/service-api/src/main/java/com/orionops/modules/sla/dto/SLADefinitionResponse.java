package com.orionops.modules.sla.dto;

import com.orionops.modules.sla.entity.SLADefinition;
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
public class SLADefinitionResponse {

    private UUID id;
    private String name;
    private String description;
    private int responseTimeHours;
    private int resolutionTimeHours;
    private String entityType;
    private String priority;
    private UUID serviceId;
    private SLADefinition.SLAType slaType;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
