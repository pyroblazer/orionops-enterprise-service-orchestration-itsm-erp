package com.orionops.modules.problem.dto;

import com.orionops.modules.problem.entity.Problem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for problem data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProblemResponse {

    private UUID id;
    private String title;
    private String description;
    private Problem.ProblemPriority priority;
    private Problem.ProblemStatus status;
    private String category;
    private String rootCause;
    private String workaround;
    private UUID assigneeId;
    private UUID serviceId;
    private UUID relatedIncidentId;
    private UUID resolvedBy;
    private LocalDateTime resolvedAt;
    private LocalDateTime closedAt;
    private UUID tenantId;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
