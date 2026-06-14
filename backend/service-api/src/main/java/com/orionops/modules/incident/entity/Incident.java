package com.orionops.modules.incident.entity;

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
 * Represents an ITIL Incident entity. Tracks service disruptions and
 * their resolution lifecycle from creation through closure.
 *
 * <p>Uses CQRS-style event sourcing where state changes emit domain events
 * that are persisted to both the incident table and the event store.</p>
 */
@Entity
@Table(name = "incidents")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Incident extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 50)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private IncidentPriority priority = IncidentPriority.MEDIUM;

    @Column(length = 50)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private IncidentImpact impact = IncidentImpact.MODERATE;

    @Column(length = 50)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private IncidentUrgency urgency = IncidentUrgency.MEDIUM;

    @Column(length = 50)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private IncidentStatus status = IncidentStatus.OPEN;

    @Column
    private String category;

    @Column
    private String subcategory;

    @Column
    private UUID serviceId;

    @Column
    private UUID ciId;

    @Column
    private UUID assigneeId;

    @Column
    private UUID assigneeGroupId;

    @Column
    private UUID reporterId;

    @Column
    private UUID resolvedBy;

    @Column
    private UUID closedBy;

    @Column
    private Integer escalationLevel;

    @Column
    private String resolution;

    @Column
    private String resolutionCode;

    @Column
    private String closureCode;

    @Column
    private LocalDateTime resolvedAt;

    @Column
    private LocalDateTime closedAt;

    @Column
    private LocalDateTime slaResponseTarget;

    @Column
    private LocalDateTime slaResolutionTarget;

    @Column
    private LocalDateTime acknowledgedAt;

    @Column
    private UUID parentIncidentId;

    /**
     * Incident priority enumeration following ITIL standards.
     */
    public enum IncidentPriority {
        CRITICAL, HIGH, MEDIUM, LOW
    }

    /**
     * Incident impact enumeration.
     */
    public enum IncidentImpact {
        WIDESPREAD, SIGNIFICANT, MODERATE, MINOR
    }

    /**
     * Incident urgency enumeration.
     */
    public enum IncidentUrgency {
        CRITICAL, HIGH, MEDIUM, LOW
    }

    /**
     * Incident status lifecycle enumeration.
     */
    public enum IncidentStatus {
        OPEN, IN_PROGRESS, ON_HOLD, RESOLVED, CLOSED, CANCELLED
    }
}
