package com.orionops.modules.cmdb.entity;

import com.orionops.common.auditing.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "ci_relationships")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CIRelationship extends BaseEntity {

    @Column(nullable = false)
    private UUID sourceCiId;

    @Column(nullable = false)
    private UUID targetCiId;

    @Column(nullable = false)
    private String relationshipType;

    @Column
    private String description;
}
