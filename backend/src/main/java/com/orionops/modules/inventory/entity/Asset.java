package com.orionops.modules.inventory.entity;

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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "assets")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Asset extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(unique = true)
    private String assetTag;

    @Enumerated(EnumType.STRING)
    private AssetType type;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private AssetStatus status = AssetStatus.AVAILABLE;

    @Column(precision = 15, scale = 2)
    private BigDecimal purchasePrice;

    @Column
    private LocalDateTime purchaseDate;

    @Column
    private LocalDateTime warrantyExpiry;

    @Column
    private String assignedTo;

    @Column
    private UUID ciId;

    public enum AssetType { HARDWARE, SOFTWARE, EQUIPMENT, FURNITURE, VEHICLE, OTHER }
    public enum AssetStatus { AVAILABLE, IN_USE, IN_REPAIR, RETIRED, DISPOSED }
}
