package com.orionops.modules.problem.entity;

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
 * Represents an ITIL Problem entity for root cause analysis and
 * permanent resolution of recurring incidents.
 */
@Entity
@Table(name = "problems")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Problem extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ProblemPriority priority = ProblemPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ProblemStatus status = ProblemStatus.OPEN;

    @Column
    private String category;

    @Column
    private String rootCause;

    @Column(columnDefinition = "TEXT")
    private String workaround;

    @Column
    private UUID assigneeId;

    @Column
    private UUID serviceId;

    @Column
    private UUID relatedIncidentId;

    @Column
    private UUID resolvedBy;

    @Column
    private LocalDateTime resolvedAt;

    @Column
    private LocalDateTime closedAt;

    public enum ProblemPriority {
        CRITICAL, HIGH, MEDIUM, LOW
    }

    public enum ProblemStatus {
        OPEN, UNDER_INVESTIGATION, ROOT_CAUSE_IDENTIFIED, RESOLVED, CLOSED
    }
}
