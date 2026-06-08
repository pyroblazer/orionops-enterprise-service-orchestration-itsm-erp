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

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "sla_instances")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SLAInstance extends BaseEntity {

    @Column(nullable = false)
    private UUID slaDefinitionId;

    @Column(nullable = false)
    private UUID targetEntityId;

    @Column(nullable = false)
    private String targetType;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SLAStatus status = SLAStatus.ACTIVE;

    @Column(nullable = false)
    private LocalDateTime responseTarget;

    @Column(nullable = false)
    private LocalDateTime resolutionTarget;

    @Column
    private LocalDateTime respondedAt;

    @Column
    private LocalDateTime resolvedAt;

    @Column
    private LocalDateTime breachedAt;

    public enum SLAStatus {
        ACTIVE, AT_RISK, BREACHED, PAUSED, MET, COMPLETED
    }
}
