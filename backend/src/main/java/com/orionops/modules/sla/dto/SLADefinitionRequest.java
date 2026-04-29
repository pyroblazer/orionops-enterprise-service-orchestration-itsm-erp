package com.orionops.modules.sla.dto;

import com.orionops.modules.sla.entity.SLADefinition;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SLADefinitionRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private String description;

    @Positive(message = "Response time must be positive")
    private int responseTimeHours;

    @Positive(message = "Resolution time must be positive")
    private int resolutionTimeHours;

    private String entityType;
    private String priority;
    private UUID serviceId;
    private SLADefinition.SLAType slaType;
}
