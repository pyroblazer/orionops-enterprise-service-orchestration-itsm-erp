package com.orionops.modules.change.dto;

import com.orionops.modules.change.entity.ChangeRequest;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Request DTO for creating/updating a change request.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangeRequestDTO {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private ChangeRequest.ChangeType changeType;

    private ChangeRequest.ChangeRisk risk;

    private ChangeRequest.ChangeImpact impact;

    private String category;

    private UUID assigneeId;

    private UUID serviceId;

    private String implementationPlan;

    private String rollbackPlan;

    private String testPlan;

    private LocalDateTime plannedStart;

    private LocalDateTime plannedEnd;
}
