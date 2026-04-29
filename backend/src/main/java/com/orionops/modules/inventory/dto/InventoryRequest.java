package com.orionops.modules.inventory.dto;

import com.orionops.modules.inventory.entity.Asset;
import com.orionops.modules.inventory.entity.InventoryItem;
import com.orionops.modules.inventory.entity.StockMovement;
import com.orionops.modules.inventory.entity.Warehouse;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class InventoryRequest {

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ItemRequest {
        @NotBlank private String name; private String description; private String sku; private String category;
        private int quantity; private int minimumQuantity; private BigDecimal unitPrice; private UUID warehouseId; private String location;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AssetRequest {
        @NotBlank private String name; private String description; private String assetTag;
        private Asset.AssetType type; private BigDecimal purchasePrice;
        private LocalDateTime purchaseDate; private LocalDateTime warrantyExpiry; private String assignedTo; private UUID ciId;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class WarehouseRequest {
        @NotBlank private String name; private String location; private String manager;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class StockMovementRequest {
        private UUID itemId; @Positive private int quantity; private StockMovement.MovementType type;
        private UUID fromWarehouseId; private UUID toWarehouseId; private String reason;
    }
}
