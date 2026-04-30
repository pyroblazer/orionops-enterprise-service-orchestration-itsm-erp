package com.orionops.modules.inventory.controller;

import com.orionops.common.dto.ApiResponse;
import com.orionops.modules.inventory.dto.InventoryRequest;
import com.orionops.modules.inventory.dto.InventoryResponse;
import com.orionops.modules.inventory.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
@Tag(name = "Inventory", description = "Inventory and asset management")
public class InventoryController {

    private final InventoryService inventoryService;

    @PostMapping("/items")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<InventoryResponse.ItemResponse>> createItem(@Valid @RequestBody InventoryRequest.ItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(inventoryService.createItem(request), "Item created"));
    }

    @GetMapping("/items")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'AGENT')")
    public ResponseEntity<ApiResponse<List<InventoryResponse.ItemResponse>>> listItems() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.listItems()));
    }

    @GetMapping("/items/{id}")
    @Operation(summary = "Get inventory item", description = "Retrieves an inventory item by ID")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'AGENT')")
    public ResponseEntity<ApiResponse<InventoryResponse.ItemResponse>> getItem(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getItem(id)));
    }

    @PutMapping("/items/{id}")
    @Operation(summary = "Update inventory item", description = "Updates an existing inventory item")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<InventoryResponse.ItemResponse>> updateItem(
            @PathVariable UUID id, @Valid @RequestBody InventoryRequest.ItemRequest request) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.updateItem(id, request), "Item updated"));
    }

    @DeleteMapping("/items/{id}")
    @Operation(summary = "Delete inventory item", description = "Soft-deletes an inventory item")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteItem(@PathVariable UUID id) {
        inventoryService.deleteItem(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Item deleted"));
    }

    @GetMapping("/items/low-stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<InventoryResponse.ItemResponse>>> getLowStockItems() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getLowStockItems()));
    }

    @PostMapping("/movements")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'AGENT')")
    public ResponseEntity<ApiResponse<InventoryResponse.MovementResponse>> recordMovement(@Valid @RequestBody InventoryRequest.StockMovementRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(inventoryService.recordMovement(request), "Movement recorded"));
    }

    @PostMapping("/assets")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<InventoryResponse.AssetResponse>> createAsset(@Valid @RequestBody InventoryRequest.AssetRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(inventoryService.createAsset(request), "Asset created"));
    }

    @GetMapping("/assets")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'AGENT')")
    public ResponseEntity<ApiResponse<List<InventoryResponse.AssetResponse>>> listAssets() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.listAssets()));
    }

    @GetMapping("/assets/{id}")
    @Operation(summary = "Get asset", description = "Retrieves an asset by ID")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'AGENT')")
    public ResponseEntity<ApiResponse<InventoryResponse.AssetResponse>> getAsset(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getAsset(id)));
    }

    @PutMapping("/assets/{id}")
    @Operation(summary = "Update asset", description = "Updates an existing asset")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<InventoryResponse.AssetResponse>> updateAsset(
            @PathVariable UUID id, @Valid @RequestBody InventoryRequest.AssetRequest request) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.updateAsset(id, request), "Asset updated"));
    }

    @DeleteMapping("/assets/{id}")
    @Operation(summary = "Delete asset", description = "Soft-deletes an asset")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteAsset(@PathVariable UUID id) {
        inventoryService.deleteAsset(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Asset deleted"));
    }

    @PostMapping("/warehouses")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<InventoryResponse.WarehouseResponse>> createWarehouse(@Valid @RequestBody InventoryRequest.WarehouseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(inventoryService.createWarehouse(request), "Warehouse created"));
    }

    @GetMapping("/warehouses")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'AGENT')")
    public ResponseEntity<ApiResponse<List<InventoryResponse.WarehouseResponse>>> listWarehouses() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.listWarehouses()));
    }

    @GetMapping("/warehouses/{id}")
    @Operation(summary = "Get warehouse", description = "Retrieves a warehouse by ID")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'AGENT')")
    public ResponseEntity<ApiResponse<InventoryResponse.WarehouseResponse>> getWarehouse(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getWarehouse(id)));
    }

    @PutMapping("/warehouses/{id}")
    @Operation(summary = "Update warehouse", description = "Updates an existing warehouse")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<InventoryResponse.WarehouseResponse>> updateWarehouse(
            @PathVariable UUID id, @Valid @RequestBody InventoryRequest.WarehouseRequest request) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.updateWarehouse(id, request), "Warehouse updated"));
    }

    @DeleteMapping("/warehouses/{id}")
    @Operation(summary = "Delete warehouse", description = "Soft-deletes a warehouse")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteWarehouse(@PathVariable UUID id) {
        inventoryService.deleteWarehouse(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Warehouse deleted"));
    }
}
