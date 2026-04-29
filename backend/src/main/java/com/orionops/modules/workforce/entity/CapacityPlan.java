package com.orionops.modules.workforce.entity;

import com.orionops.common.auditing.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "capacity_plans")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CapacityPlan extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column
    private LocalDateTime periodStart;

    @Column
    private LocalDateTime periodEnd;

    @Column
    private Integer totalCapacity;

    @Column
    private Integer allocatedCapacity;

    @Column
    private String department;
}
