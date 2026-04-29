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

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "inventory_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryItem extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column
    private String sku;

    @Column
    private String category;

    @Column(nullable = false)
    private int quantity;

    @Column
    private int minimumQuantity;

    @Column(precision = 15, scale = 2)
    private BigDecimal unitPrice;

    @Column
    private UUID warehouseId;

    @Column
    private String location;
}
