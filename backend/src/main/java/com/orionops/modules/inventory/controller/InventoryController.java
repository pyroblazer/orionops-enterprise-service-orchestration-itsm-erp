package com.orionops.modules.inventory.controller;

import com.orionops.common.dto.ApiResponse;
import com.orionops.modules.inventory.dto.InventoryRequest;
import com.orionops.modules.inventory.dto.InventoryResponse;
import com.orionops.modules.inventory.service.InventoryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
}
