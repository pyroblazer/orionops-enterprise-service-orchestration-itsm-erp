package com.orionops.modules.billing.entity;

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
import java.util.UUID;

@Entity
@Table(name = "service_usages")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceUsage extends BaseEntity {

    @Column(nullable = false)
    private UUID serviceId;

    @Column(nullable = false)
    private UUID tenantEntityId;

    @Column
    private String usageType;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal quantity;

    @Column(precision = 15, scale = 2)
    private BigDecimal unitCost;

    @Column(precision = 15, scale = 2)
    private BigDecimal totalCost;

    @Column(nullable = false)
    private LocalDateTime usageDate;

    @Column
    private String description;
}
