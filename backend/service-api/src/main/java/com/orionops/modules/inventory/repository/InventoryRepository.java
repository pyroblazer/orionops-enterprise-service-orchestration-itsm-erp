package com.orionops.modules.inventory.repository;

import com.orionops.modules.inventory.entity.Asset;
import com.orionops.modules.inventory.entity.InventoryItem;
import com.orionops.modules.inventory.entity.StockMovement;
import com.orionops.modules.inventory.entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

public class InventoryRepository {

    @Repository
    public interface ItemRepository extends JpaRepository<InventoryItem, UUID> {
        List<InventoryItem> findByTenantIdAndDeletedAtIsNull(UUID tenantId);
        @Query("SELECT i FROM InventoryItem i WHERE i.tenantId = :tenantId AND i.deletedAt IS NULL AND i.quantity <= i.minimumQuantity")
        List<InventoryItem> findLowStockItems(UUID tenantId);
    }

    @Repository
    public interface AssetRepository extends JpaRepository<Asset, UUID> {
        List<Asset> findByTenantIdAndDeletedAtIsNull(UUID tenantId);
    }

    @Repository
    public interface WarehouseRepository extends JpaRepository<Warehouse, UUID> {
        List<Warehouse> findByTenantIdAndDeletedAtIsNull(UUID tenantId);
    }

    @Repository
    public interface StockMovementRepository extends JpaRepository<StockMovement, UUID> {
        List<StockMovement> findByTenantIdAndDeletedAtIsNull(UUID tenantId);
    }
}
