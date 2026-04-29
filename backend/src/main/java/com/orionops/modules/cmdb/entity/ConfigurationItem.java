package com.orionops.modules.cmdb.entity;

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

import java.util.UUID;

@Entity
@Table(name = "configuration_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfigurationItem extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    private CIType type;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private CIStatus status = CIStatus.ACTIVE;

    @Column
    private String environment;

    @Column
    private String ownerId;

    @Column
    private String location;

    @Column
    private String version;

    @Column
    private UUID parentId;

    @Column
    private String attributes;

    public enum CIType {
        SERVER, APPLICATION, DATABASE, NETWORK_DEVICE, SERVICE, SOFTWARE, HARDWARE, VIRTUAL_MACHINE, CONTAINER, OTHER
    }

    public enum CIStatus {
        ACTIVE, INACTIVE, MAINTENANCE, RETIRED
    }
}
