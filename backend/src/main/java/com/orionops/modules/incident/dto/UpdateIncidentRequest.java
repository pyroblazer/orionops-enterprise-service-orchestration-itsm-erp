package com.orionops.modules.incident.dto;

import com.orionops.modules.incident.entity.Incident;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Request DTO for updating an existing incident.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateIncidentRequest {

    private String title;

    private String description;

    private Incident.IncidentPriority priority;

    private Incident.IncidentImpact impact;

    private Incident.IncidentUrgency urgency;

    private String category;

    private String subcategory;

    private UUID serviceId;

    private UUID ciId;

    private UUID assigneeId;

    private UUID assigneeGroupId;
}
