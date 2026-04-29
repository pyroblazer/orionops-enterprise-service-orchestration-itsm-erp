package com.orionops.modules.inventory.service;

import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.modules.inventory.dto.InventoryRequest;
import com.orionops.modules.inventory.dto.InventoryResponse;
import com.orionops.modules.inventory.entity.*;
import com.orionops.modules.inventory.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository.ItemRepository itemRepository;
    private final InventoryRepository.AssetRepository assetRepository;
    private final InventoryRepository.WarehouseRepository warehouseRepository;
    private final InventoryRepository.StockMovementRepository movementRepository;

    @Transactional
    public InventoryResponse.ItemResponse createItem(InventoryRequest.ItemRequest req) {
        InventoryItem item = InventoryItem.builder()
                .name(req.getName()).description(req.getDescription()).sku(req.getSku())
                .category(req.getCategory()).quantity(req.getQuantity()).minimumQuantity(req.getMinimumQuantity())
                .unitPrice(req.getUnitPrice()).warehouseId(req.getWarehouseId()).location(req.getLocation())
                .tenantId(resolveTenantId()).build();
        return mapItem(itemRepository.save(item));
    }

    @Transactional(readOnly = true)
    public List<InventoryResponse.ItemResponse> listItems() {
        return itemRepository.findByTenantIdAndDeletedAtIsNull(resolveTenantId()).stream().map(this::mapItem).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InventoryResponse.ItemResponse> getLowStockItems() {
        return itemRepository.findLowStockItems(resolveTenantId()).stream().map(this::mapItem).collect(Collectors.toList());
    }

    @Transactional
    public InventoryResponse.MovementResponse recordMovement(InventoryRequest.StockMovementRequest req) {
        InventoryItem item = itemRepository.findById(req.getItemId())
                .filter(i -> !i.isDeleted()).orElseThrow(() -> new ResourceNotFoundException("InventoryItem", req.getItemId()));

        switch (req.getType()) {
            case IN -> item.setQuantity(item.getQuantity() + req.getQuantity());
            case OUT -> {
                if (item.getQuantity() < req.getQuantity()) throw new RuntimeException("Insufficient stock");
                item.setQuantity(item.getQuantity() - req.getQuantity());
            }
            case TRANSFER -> { /* Warehouse-level tracking */ }
            case ADJUSTMENT -> item.setQuantity(req.getQuantity());
        }
        itemRepository.save(item);

        StockMovement movement = StockMovement.builder()
                .itemId(req.getItemId()).quantity(req.getQuantity()).type(req.getType())
                .fromWarehouseId(req.getFromWarehouseId()).toWarehouseId(req.getToWarehouseId())
                .reason(req.getReason()).tenantId(resolveTenantId()).build();
        return mapMovement(movementRepository.save(movement));
    }

    @Transactional
    public InventoryResponse.AssetResponse createAsset(InventoryRequest.AssetRequest req) {
        Asset asset = Asset.builder()
                .name(req.getName()).description(req.getDescription()).assetTag(req.getAssetTag())
                .type(req.getType()).purchasePrice(req.getPurchasePrice())
                .purchaseDate(req.getPurchaseDate()).warrantyExpiry(req.getWarrantyExpiry())
                .assignedTo(req.getAssignedTo()).ciId(req.getCiId()).tenantId(resolveTenantId()).build();
        return mapAsset(assetRepository.save(asset));
    }

    @Transactional(readOnly = true)
    public List<InventoryResponse.AssetResponse> listAssets() {
        return assetRepository.findByTenantIdAndDeletedAtIsNull(resolveTenantId()).stream().map(this::mapAsset).collect(Collectors.toList());
    }

    @Transactional
    public InventoryResponse.WarehouseResponse createWarehouse(InventoryRequest.WarehouseRequest req) {
        Warehouse wh = Warehouse.builder()
                .name(req.getName()).location(req.getLocation()).manager(req.getManager())
                .tenantId(resolveTenantId()).build();
        return mapWarehouse(warehouseRepository.save(wh));
    }

    @Transactional(readOnly = true)
    public List<InventoryResponse.WarehouseResponse> listWarehouses() {
        return warehouseRepository.findByTenantIdAndDeletedAtIsNull(resolveTenantId()).stream().map(this::mapWarehouse).collect(Collectors.toList());
    }

    private UUID resolveTenantId() { return UUID.fromString("00000000-0000-0000-0000-000000000001"); }

    private InventoryResponse.ItemResponse mapItem(InventoryItem i) {
        return InventoryResponse.ItemResponse.builder().id(i.getId()).name(i.getName())
                .description(i.getDescription()).sku(i.getSku()).category(i.getCategory())
                .quantity(i.getQuantity()).minimumQuantity(i.getMinimumQuantity())
                .unitPrice(i.getUnitPrice()).warehouseId(i.getWarehouseId()).location(i.getLocation())
                .createdAt(i.getCreatedAt()).build();
    }

    private InventoryResponse.AssetResponse mapAsset(Asset a) {
        return InventoryResponse.AssetResponse.builder().id(a.getId()).name(a.getName())
                .description(a.getDescription()).assetTag(a.getAssetTag())
                .type(a.getType() != null ? a.getType().name() : null)
                .status(a.getStatus() != null ? a.getStatus().name() : null)
                .purchasePrice(a.getPurchasePrice()).purchaseDate(a.getPurchaseDate())
                .warrantyExpiry(a.getWarrantyExpiry()).assignedTo(a.getAssignedTo())
                .ciId(a.getCiId()).createdAt(a.getCreatedAt()).build();
    }

    private InventoryResponse.WarehouseResponse mapWarehouse(Warehouse w) {
        return InventoryResponse.WarehouseResponse.builder().id(w.getId()).name(w.getName())
                .location(w.getLocation()).manager(w.getManager()).active(w.isActive())
                .createdAt(w.getCreatedAt()).build();
    }

    private InventoryResponse.MovementResponse mapMovement(StockMovement m) {
        return InventoryResponse.MovementResponse.builder().id(m.getId()).itemId(m.getItemId())
                .quantity(m.getQuantity()).type(m.getType() != null ? m.getType().name() : null)
                .fromWarehouseId(m.getFromWarehouseId()).toWarehouseId(m.getToWarehouseId())
                .reason(m.getReason()).performedBy(m.getPerformedBy()).createdAt(m.getCreatedAt()).build();
    }
}
