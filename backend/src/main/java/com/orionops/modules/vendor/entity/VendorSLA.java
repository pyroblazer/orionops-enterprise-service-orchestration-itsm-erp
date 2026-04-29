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

import java.time.LocalDateTime;

@Entity
@Table(name = "vendor_slas")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorSLA extends BaseEntity {

    @Column(nullable = false)
    private UUID vendorId;

    @Column(nullable = false)
    private String name;

    @Column
    private String description;

    @Column(nullable = false)
    private int responseTimeHours;

    @Column(nullable = false)
    private int resolutionTimeHours;

    @Column
    private LocalDateTime startDate;

    @Column
    private LocalDateTime endDate;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;
}
