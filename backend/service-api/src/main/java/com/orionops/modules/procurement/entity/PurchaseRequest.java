package com.orionops.modules.procurement.entity;

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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "purchase_requests")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseRequest extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal estimatedCost;

    @Column
    private UUID requestedBy;

    @Column
    private UUID approvedBy;

    @Column
    private UUID vendorId;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PRStatus status = PRStatus.DRAFT;

    @Column
    private LocalDateTime submittedAt;

    @Column
    private LocalDateTime approvedAt;

    public enum PRStatus {
        DRAFT, SUBMITTED, APPROVED, REJECTED, ORDERED, CANCELLED
    }
}
