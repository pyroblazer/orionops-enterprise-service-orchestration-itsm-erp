package com.orionops.modules.inventory.entity;

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
@Table(name = "warehouses")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Warehouse extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column
    private String location;

    @Column
    private String manager;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;
}
