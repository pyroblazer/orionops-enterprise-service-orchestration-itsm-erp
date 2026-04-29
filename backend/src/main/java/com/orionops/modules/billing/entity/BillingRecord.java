package com.orionops.modules.billing.entity;

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

@Entity
@Table(name = "billing_records")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillingRecord extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String invoiceNumber;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(precision = 15, scale = 2)
    private BigDecimal taxAmount;

    @Column(nullable = false)
    private LocalDateTime periodStart;

    @Column(nullable = false)
    private LocalDateTime periodEnd;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private BillingStatus status = BillingStatus.PENDING;

    @Column
    private LocalDateTime generatedAt;

    @Column
    private LocalDateTime paidAt;

    public enum BillingStatus { PENDING, PAID, OVERDUE, CANCELLED }
}
