package com.orionops.modules.vendor.entity;

import com.orionops.common.auditing.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "vendor_performances")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorPerformance extends BaseEntity {

    @Column(nullable = false)
    private UUID vendorId;

    @Column(precision = 3, scale = 2)
    private BigDecimal qualityScore;

    @Column(precision = 3, scale = 2)
    private BigDecimal deliveryScore;

    @Column(precision = 3, scale = 2)
    private BigDecimal responsivenessScore;

    @Column(precision = 3, scale = 2)
    private BigDecimal overallScore;

    @Column
    private LocalDateTime evaluationDate;

    @Column
    private String evaluator;

    @Column(columnDefinition = "TEXT")
    private String comments;
}
