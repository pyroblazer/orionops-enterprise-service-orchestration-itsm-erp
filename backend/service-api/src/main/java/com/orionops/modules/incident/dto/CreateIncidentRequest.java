package com.orionops.modules.incident.dto;

import com.orionops.modules.incident.entity.Incident;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Request DTO for creating a new incident.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateIncidentRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private Incident.IncidentPriority priority;

    private Incident.IncidentImpact impact;

    private Incident.IncidentUrgency urgency;

    private String category;

    private String subcategory;

    private UUID serviceId;

    private UUID ciId;

    private UUID reporterId;

    private UUID assigneeId;

    private UUID assigneeGroupId;

    private UUID parentIncidentId;
}
