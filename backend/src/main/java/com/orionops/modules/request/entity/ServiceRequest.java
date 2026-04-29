package com.orionops.modules.request.entity;

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

@Entity
@Table(name = "service_requests")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceRequest extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private RequestStatus status = RequestStatus.DRAFT;

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
    private String fulfillmentNotes;

    @Column
    private LocalDateTime submittedAt;

    @Column
    private LocalDateTime approvedAt;

    @Column
    private LocalDateTime fulfilledAt;

    @Column
    private LocalDateTime closedAt;

    public enum RequestStatus {
        DRAFT, SUBMITTED, APPROVED, IN_FULFILLMENT, FULFILLED, CLOSED, CANCELLED
    }
}
