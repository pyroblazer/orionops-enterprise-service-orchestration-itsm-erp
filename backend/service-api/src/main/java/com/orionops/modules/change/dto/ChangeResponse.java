package com.orionops.modules.change.dto;

import com.orionops.modules.change.entity.ChangeRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for change request data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangeResponse {

    private UUID id;
    private String title;
    private String description;
    private ChangeRequest.ChangeType changeType;
    private ChangeRequest.ChangeStatus status;
    private ChangeRequest.ChangeRisk risk;
    private ChangeRequest.ChangeImpact impact;
    private String category;
    private UUID requesterId;
    private UUID assigneeId;
    private UUID approverId;
    private UUID serviceId;
    private String implementationPlan;
    private String rollbackPlan;
    private String testPlan;
    private LocalDateTime plannedStart;
    private LocalDateTime plannedEnd;
    private LocalDateTime implementedAt;
    private LocalDateTime approvedAt;
    private LocalDateTime closedAt;
    private String rejectionReason;
    private String implementationNotes;
    private UUID tenantId;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
