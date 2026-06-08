package com.orionops.modules.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class InventoryResponse {

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ItemResponse {
        private UUID id; private String name; private String description; private String sku;
        private String category; private int quantity; private int minimumQuantity;
        private BigDecimal unitPrice; private UUID warehouseId; private String location;
        private LocalDateTime createdAt;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AssetResponse {
        private UUID id; private String name; private String description; private String assetTag;
        private String type; private String status; private BigDecimal purchasePrice;
        private LocalDateTime purchaseDate; private LocalDateTime warrantyExpiry;
        private String assignedTo; private UUID ciId; private LocalDateTime createdAt;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class WarehouseResponse {
        private UUID id; private String name; private String location;
        private String manager; private boolean active; private LocalDateTime createdAt;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MovementResponse {
        private UUID id; private UUID itemId; private int quantity; private String type;
        private UUID fromWarehouseId; private UUID toWarehouseId; private String reason;
        private String performedBy; private LocalDateTime createdAt;
    }
}
