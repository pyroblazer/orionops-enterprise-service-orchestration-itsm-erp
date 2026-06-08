package com.orionops.modules.problem.dto;

import com.orionops.modules.problem.entity.Problem;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Request DTO for creating/updating a problem.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProblemRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private Problem.ProblemPriority priority;

    private String category;

    private UUID assigneeId;

    private UUID serviceId;

    private UUID relatedIncidentId;

    private String workaround;
}
