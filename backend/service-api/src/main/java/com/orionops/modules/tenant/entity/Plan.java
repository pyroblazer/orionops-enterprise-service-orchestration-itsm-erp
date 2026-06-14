package com.orionops.modules.tenant.entity;

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

@Entity
@Table(name = "plans")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Plan extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(precision = 15, scale = 2)
    private BigDecimal monthlyPrice;

    @Column(precision = 15, scale = 2)
    private BigDecimal annualPrice;

    @Column
    private String stripePriceId;

    @Column
    private Integer maxUsers;

    @Column
    private String features;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;
}
