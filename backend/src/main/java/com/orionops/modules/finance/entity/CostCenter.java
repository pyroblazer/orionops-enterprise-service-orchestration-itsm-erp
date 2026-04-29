package com.orionops.modules.finance.entity;

import com.orionops.common.auditing.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
    private String owner;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;
}
