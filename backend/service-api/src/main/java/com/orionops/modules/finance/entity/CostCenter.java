package com.orionops.modules.finance.entity;

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
@Table(name = "cost_centers")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CostCenter extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column
    private String code;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column
    private UUID ownerId;

    @Column(precision = 15, scale = 2)
    private BigDecimal budgetAmount;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private CostCenterStatus status = CostCenterStatus.ACTIVE;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    public enum CostCenterStatus { ACTIVE, INACTIVE, ARCHIVED }
}
