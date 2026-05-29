package com.orionops.modules.inventory.service;

import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.modules.inventory.dto.InventoryRequest;
import com.orionops.modules.inventory.dto.InventoryResponse;
import com.orionops.modules.inventory.entity.*;
import com.orionops.modules.inventory.repository.InventoryRepository;
import com.orionops.modules.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.orionops.common.tenant.TenantContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
    private final NotificationService notificationService;

    @Transactional
    public InventoryResponse.ItemResponse createItem(InventoryRequest.ItemRequest req) {
        InventoryItem item = InventoryItem.builder()
                .name(req.getName()).description(req.getDescription()).sku(req.getSku())
                .category(req.getCategory()).quantity(req.getQuantity()).minimumQuantity(req.getMinimumQuantity())
                .unitPrice(req.getUnitPrice()).warehouseId(req.getWarehouseId()).location(req.getLocation())
                .build();
        item.setTenantId(resolveTenantId());
        return mapItem(itemRepository.save(item));
    }

    @Transactional(readOnly = true)
    public List<InventoryResponse.ItemResponse> listItems() {
        return itemRepository.findByTenantIdAndDeletedAtIsNull(resolveTenantId()).stream().map(this::mapItem).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InventoryResponse.ItemResponse getItem(UUID id) {
        return mapItem(findItemOrThrow(id));
    }

    @Transactional
    public InventoryResponse.ItemResponse updateItem(UUID id, InventoryRequest.ItemRequest req) {
        InventoryItem item = findItemOrThrow(id);
        item.setName(req.getName());
        item.setDescription(req.getDescription());
        item.setSku(req.getSku());
        item.setCategory(req.getCategory());
        item.setMinimumQuantity(req.getMinimumQuantity());
        item.setUnitPrice(req.getUnitPrice());
        item.setWarehouseId(req.getWarehouseId());
        item.setLocation(req.getLocation());
        return mapItem(itemRepository.save(item));
    }

    @Transactional
    public void deleteItem(UUID id) {
        InventoryItem item = findItemOrThrow(id);
        item.softDelete();
        itemRepository.save(item);
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
                .reason(req.getReason()).build();
        movement.setTenantId(resolveTenantId());
        return mapMovement(movementRepository.save(movement));
    }

    @Transactional
    public InventoryResponse.AssetResponse createAsset(InventoryRequest.AssetRequest req) {
        Asset asset = Asset.builder()
                .name(req.getName()).description(req.getDescription()).assetTag(req.getAssetTag())
                .type(req.getType()).purchasePrice(req.getPurchasePrice())
                .purchaseDate(req.getPurchaseDate()).warrantyExpiry(req.getWarrantyExpiry())
                .assignedTo(req.getAssignedTo()).ciId(req.getCiId()).build();
        asset.setTenantId(resolveTenantId());
        return mapAsset(assetRepository.save(asset));
    }

    @Transactional(readOnly = true)
    public List<InventoryResponse.AssetResponse> listAssets() {
        return assetRepository.findByTenantIdAndDeletedAtIsNull(resolveTenantId()).stream().map(this::mapAsset).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InventoryResponse.AssetResponse getAsset(UUID id) {
        return mapAsset(findAssetOrThrow(id));
    }

    @Transactional
    public InventoryResponse.AssetResponse updateAsset(UUID id, InventoryRequest.AssetRequest req) {
        Asset asset = findAssetOrThrow(id);
        asset.setName(req.getName());
        asset.setDescription(req.getDescription());
        asset.setAssetTag(req.getAssetTag());
        asset.setType(req.getType());
        asset.setPurchasePrice(req.getPurchasePrice());
        asset.setPurchaseDate(req.getPurchaseDate());
        asset.setWarrantyExpiry(req.getWarrantyExpiry());
        asset.setAssignedTo(req.getAssignedTo());
        asset.setCiId(req.getCiId());
        return mapAsset(assetRepository.save(asset));
    }

    @Transactional
    public void deleteAsset(UUID id) {
        Asset asset = findAssetOrThrow(id);
        asset.softDelete();
        assetRepository.save(asset);
    }

    @Transactional
    public InventoryResponse.WarehouseResponse createWarehouse(InventoryRequest.WarehouseRequest req) {
        Warehouse wh = Warehouse.builder()
                .name(req.getName()).location(req.getLocation()).manager(req.getManager())
                .build();
        wh.setTenantId(resolveTenantId());
        return mapWarehouse(warehouseRepository.save(wh));
    }

    @Transactional(readOnly = true)
    public List<InventoryResponse.WarehouseResponse> listWarehouses() {
        return warehouseRepository.findByTenantIdAndDeletedAtIsNull(resolveTenantId()).stream().map(this::mapWarehouse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InventoryResponse.WarehouseResponse getWarehouse(UUID id) {
        return mapWarehouse(findWarehouseOrThrow(id));
    }

    @Transactional
    public InventoryResponse.WarehouseResponse updateWarehouse(UUID id, InventoryRequest.WarehouseRequest req) {
        Warehouse wh = findWarehouseOrThrow(id);
        wh.setName(req.getName());
        wh.setLocation(req.getLocation());
        wh.setManager(req.getManager());
        return mapWarehouse(warehouseRepository.save(wh));
    }

    @Transactional
    public void deleteWarehouse(UUID id) {
        Warehouse wh = findWarehouseOrThrow(id);
        wh.softDelete();
        warehouseRepository.save(wh);
    }

    // ---- Asset Lifecycle Management ----

    @Transactional(readOnly = true)
    public Map<String, Object> computeDepreciation(UUID assetId) {
        Asset asset = findAssetOrThrow(assetId);
        if (asset.getPurchasePrice() == null || asset.getPurchaseDate() == null) {
            return Map.of("error", "Missing purchase price or date");
        }

        BigDecimal usefulLifeYears = BigDecimal.valueOf(5);
        BigDecimal salvageValue = BigDecimal.ZERO;
        long monthsInService = java.time.temporal.ChronoUnit.MONTHS.between(
            asset.getPurchaseDate().toLocalDate(), LocalDate.now()
        );

        BigDecimal depreciableBase = asset.getPurchasePrice().subtract(salvageValue);
        BigDecimal monthlyDepreciation = depreciableBase.divide(
            BigDecimal.valueOf(usefulLifeYears.longValue() * 12), 2, java.math.RoundingMode.HALF_UP
        );
        BigDecimal accumulatedDepreciation = monthlyDepreciation.multiply(BigDecimal.valueOf(monthsInService));
        BigDecimal bookValue = asset.getPurchasePrice().subtract(accumulatedDepreciation);

        return Map.of(
            "assetId", assetId,
            "purchasePrice", asset.getPurchasePrice(),
            "accumulatedDepreciation", accumulatedDepreciation,
            "bookValue", bookValue,
            "monthsInService", monthsInService
        );
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getWarrantyExpiryAlerts(UUID tenantId) {
        LocalDate in60Days = LocalDate.now().plusDays(60);
        return assetRepository.findByTenantIdAndDeletedAtIsNull(tenantId).stream()
            .filter(a -> a.getWarrantyExpiry() != null &&
                    a.getWarrantyExpiry().toLocalDate().isBefore(in60Days) &&
                    a.getWarrantyExpiry().toLocalDate().isAfter(LocalDate.now()))
            .map(a -> Map.of(
                "assetId", (Object) a.getId(),
                "assetTag", a.getAssetTag(),
                "warrantyExpiry", a.getWarrantyExpiry(),
                "daysUntilExpiry", java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), a.getWarrantyExpiry().toLocalDate())
            ))
            .collect(Collectors.toList());
    }

    @Scheduled(cron = "0 0 9 * * *")
    @Transactional
    public void checkAssetWarrantyExpiryAlerts() {
        UUID tenantId = resolveTenantId();
        LocalDate in30Days = LocalDate.now().plusDays(30);

        List<Asset> expiring = assetRepository.findByTenantIdAndDeletedAtIsNull(tenantId).stream()
            .filter(a -> a.getWarrantyExpiry() != null &&
                    a.getWarrantyExpiry().toLocalDate().isBefore(in30Days) &&
                    a.getWarrantyExpiry().toLocalDate().isAfter(LocalDate.now()))
            .collect(Collectors.toList());

        for (Asset asset : expiring) {
            try {
                notificationService.createNotification(
                    UUID.randomUUID(),
                    "Asset Warranty Expiring: " + asset.getAssetTag(),
                    "Warranty for asset " + asset.getName() + " expires on " + asset.getWarrantyExpiry(),
                    "ASSET_WARRANTY_EXPIRY",
                    asset.getId(),
                    "ASSET"
                );
                log.info("Asset warranty expiry alert sent for asset: {}", asset.getId());
            } catch (Exception e) {
                log.warn("Failed to send asset warranty alert: {}", e.getMessage());
            }
        }
    }

    private UUID resolveTenantId() {
        return TenantContextHolder.getCurrentTenantId();
    }

    private InventoryItem findItemOrThrow(UUID id) {
        return itemRepository.findById(id).filter(i -> !i.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("InventoryItem", id));
    }

    private Asset findAssetOrThrow(UUID id) {
        return assetRepository.findById(id).filter(a -> !a.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Asset", id));
    }

    private Warehouse findWarehouseOrThrow(UUID id) {
        return warehouseRepository.findById(id).filter(w -> !w.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", id));
    }

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
