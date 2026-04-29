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

import java.util.UUID;

@Entity
@Table(name = "stock_movements")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockMovement extends BaseEntity {

    @Column(nullable = false)
    private UUID itemId;

    @Column(nullable = false)
    private int quantity;

    @Enumerated(EnumType.STRING)
    private MovementType type;

    @Column
    private UUID fromWarehouseId;

    @Column
    private UUID toWarehouseId;

    @Column
    private String reason;

    @Column
    private String performedBy;

    public enum MovementType { IN, OUT, TRANSFER, ADJUSTMENT }
}
