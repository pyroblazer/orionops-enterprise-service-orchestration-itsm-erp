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
import java.util.UUID;

@Entity
@Table(name = "cost_models")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CostModel extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column
    private String description;

    @Column
    private UUID serviceId;

    @Enumerated(EnumType.STRING)
    private PricingType pricingType;

    @Column(precision = 15, scale = 2)
    private BigDecimal fixedPrice;

    @Column(precision = 15, scale = 2)
    private BigDecimal unitPrice;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    public enum PricingType { FIXED, PER_UNIT, TIERED, USAGE_BASED }
}
