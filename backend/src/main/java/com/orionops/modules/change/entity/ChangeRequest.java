package com.orionops.modules.change.entity;

import com.orionops.common.auditing.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Represents an ITIL Change Request entity for controlled change management.
 * Supports standard, normal, and emergency change types with approval workflows.
 */
@Entity
@Table(name = "change_requests")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangeRequest extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ChangeType changeType = ChangeType.STANDARD;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ChangeStatus status = ChangeStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ChangeRisk risk = ChangeRisk.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ChangeImpact impact = ChangeImpact.MODERATE;

    @Column
    private String category;

    @Column
    private UUID requesterId;

    @Column
    private UUID assigneeId;

    @Column
    private UUID approverId;

    @Column
    private UUID serviceId;

    @Column
    private String implementationPlan;

    @Column(columnDefinition = "TEXT")
    private String rollbackPlan;

    @Column(columnDefinition = "TEXT")
    private String testPlan;

    @Column
    private LocalDateTime plannedStart;

    @Column
    private LocalDateTime plannedEnd;

    @Column
    private LocalDateTime implementedAt;

    @Column
    private LocalDateTime approvedAt;

    @Column
    private LocalDateTime closedAt;

    @Column
    private String rejectionReason;

    @Column
    private String implementationNotes;

    public enum ChangeType {
        STANDARD, NORMAL, EMERGENCY
    }

    public enum ChangeStatus {
        DRAFT, SUBMITTED, APPROVED, REJECTED, IMPLEMENTING, COMPLETED, CLOSED, CANCELLED
    }

    public enum ChangeRisk {
        LOW, MEDIUM, HIGH, VERY_HIGH
    }

    public enum ChangeImpact {
        MINIMAL, MODERATE, SIGNIFICANT, EXTENSIVE
    }
}
