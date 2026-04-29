package com.orionops.modules.sla.entity;

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

@Entity
@Table(name = "sla_definitions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SLADefinition extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private int responseTimeHours;

    @Column(nullable = false)
    private int resolutionTimeHours;

    @Column
    private String entityType;

    @Column
    private String priority;

    @Column
    private UUID serviceId;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SLAType slaType = SLAType.SLA;

    @Builder.Default
    private boolean active = true;

    public enum SLAType {
        SLA, OLA, UNDERPINNING_CONTRACT
    }
}
