package com.orionops.modules.incident.dto;

import com.orionops.modules.incident.entity.Incident;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for incident data returned to API consumers.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncidentResponse {

    private UUID id;
    private String title;
    private String description;
    private Incident.IncidentPriority priority;
    private Incident.IncidentImpact impact;
    private Incident.IncidentUrgency urgency;
    private Incident.IncidentStatus status;
    private String category;
    private String subcategory;
    private UUID serviceId;
    private UUID ciId;
    private UUID assigneeId;
    private UUID assigneeGroupId;
    private UUID reporterId;
    private UUID resolvedBy;
    private UUID closedBy;
    private Integer escalationLevel;
    private String resolution;
    private String resolutionCode;
    private String closureCode;
    private LocalDateTime resolvedAt;
    private LocalDateTime closedAt;
    private LocalDateTime slaResponseTarget;
    private LocalDateTime slaResolutionTarget;
    private LocalDateTime acknowledgedAt;
    private UUID parentIncidentId;
    private UUID tenantId;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
