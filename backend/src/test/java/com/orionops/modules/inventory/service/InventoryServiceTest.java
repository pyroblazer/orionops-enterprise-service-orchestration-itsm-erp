package com.orionops.modules.inventory.service;

import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.modules.inventory.dto.InventoryRequest;
import com.orionops.modules.inventory.dto.InventoryResponse;
import com.orionops.modules.inventory.entity.Asset;
import com.orionops.modules.inventory.entity.InventoryItem;
import com.orionops.modules.inventory.entity.StockMovement;
import com.orionops.modules.inventory.entity.Warehouse;
import com.orionops.modules.inventory.repository.InventoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link InventoryService}.
 * Covers InventoryItem CRUD, stock movements, low stock detection, and Asset lifecycle.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("InventoryService")
class InventoryServiceTest {

    @Mock
    private InventoryRepository.ItemRepository itemRepository;

    @Mock
    private InventoryRepository.AssetRepository assetRepository;

    @Mock
    private InventoryRepository.WarehouseRepository warehouseRepository;

    @Mock
    private InventoryRepository.StockMovementRepository movementRepository;

    @InjectMocks
    private InventoryService inventoryService;

    private UUID tenantId;
    private InventoryItem testItem;

    @BeforeEach
    void setUp() {
        tenantId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        testItem = InventoryItem.builder()
                .name("Dell Monitor 27\"")
                .description("27 inch IPS monitor")
                .sku("MON-DELL-27")
                .category("Monitors")
                .quantity(50)
                .minimumQuantity(10)
                .unitPrice(new BigDecimal("349.99"))
                .tenantId(tenantId)
                .build();
        testItem.setId(UUID.randomUUID());
        testItem.setCreatedAt(LocalDateTime.now());
        testItem.setUpdatedAt(LocalDateTime.now());
    }

    @Nested
    @DisplayName("createItem")
    class CreateItemTests {

        @Test
        @DisplayName("should create inventory item")
        void shouldCreateItem_whenValidRequest_givenAllFields() {
            InventoryRequest.ItemRequest request = InventoryRequest.ItemRequest.builder()
                    .name("Logitech Keyboard")
                    .description("Mechanical keyboard")
                    .sku("KB-LOG-001")
                    .category("Keyboards")
                    .quantity(100)
                    .minimumQuantity(20)
                    .unitPrice(new BigDecimal("129.99"))
                    .build();

            when(itemRepository.save(any(InventoryItem.class))).thenAnswer(invocation -> {
                InventoryItem item = invocation.getArgument(0);
                item.setId(UUID.randomUUID());
                item.setCreatedAt(LocalDateTime.now());
                item.setUpdatedAt(LocalDateTime.now());
                return item;
            });

            InventoryResponse.ItemResponse response = inventoryService.createItem(request);

            assertThat(response).isNotNull();
            assertThat(response.getName()).isEqualTo("Logitech Keyboard");
            assertThat(response.getQuantity()).isEqualTo(100);
            assertThat(response.getUnitPrice()).isEqualByComparingTo(new BigDecimal("129.99"));
        }
    }

    @Nested
    @DisplayName("recordMovement")
    class RecordMovementTests {

        @Test
        @DisplayName("should increase quantity for IN movement")
        void shouldIncreaseQuantity_whenStockIn_givenValidItem() {
            InventoryRequest.StockMovementRequest request = InventoryRequest.StockMovementRequest.builder()
                    .itemId(testItem.getId())
                    .quantity(25)
                    .type(StockMovement.MovementType.IN)
                    .reason("Restocking")
                    .build();

            when(itemRepository.findById(testItem.getId())).thenReturn(Optional.of(testItem));
            when(itemRepository.save(any(InventoryItem.class))).thenReturn(testItem);
            when(movementRepository.save(any(StockMovement.class))).thenAnswer(invocation -> {
                StockMovement sm = invocation.getArgument(0);
                sm.setId(UUID.randomUUID());
                sm.setCreatedAt(LocalDateTime.now());
                return sm;
            });

            InventoryResponse.MovementResponse response = inventoryService.recordMovement(request);

            assertThat(response).isNotNull();

            ArgumentCaptor<InventoryItem> itemCaptor = ArgumentCaptor.forClass(InventoryItem.class);
            verify(itemRepository).save(itemCaptor.capture());
            assertThat(itemCaptor.getValue().getQuantity()).isEqualTo(75); // 50 + 25
        }

        @Test
        @DisplayName("should decrease quantity for OUT movement")
        void shouldDecreaseQuantity_whenStockOut_givenSufficientStock() {
            InventoryRequest.StockMovementRequest request = InventoryRequest.StockMovementRequest.builder()
                    .itemId(testItem.getId())
                    .quantity(15)
                    .type(StockMovement.MovementType.OUT)
                    .reason("Order fulfillment")
                    .build();

            when(itemRepository.findById(testItem.getId())).thenReturn(Optional.of(testItem));
            when(itemRepository.save(any(InventoryItem.class))).thenReturn(testItem);
            when(movementRepository.save(any(StockMovement.class))).thenAnswer(invocation -> {
                StockMovement sm = invocation.getArgument(0);
                sm.setId(UUID.randomUUID());
                sm.setCreatedAt(LocalDateTime.now());
                return sm;
            });

            inventoryService.recordMovement(request);

            ArgumentCaptor<InventoryItem> itemCaptor = ArgumentCaptor.forClass(InventoryItem.class);
            verify(itemRepository).save(itemCaptor.capture());
            assertThat(itemCaptor.getValue().getQuantity()).isEqualTo(35); // 50 - 15
        }

        @Test
        @DisplayName("should set exact quantity for ADJUSTMENT movement")
        void shouldSetExactQuantity_whenAdjustment_givenNewQuantity() {
            InventoryRequest.StockMovementRequest request = InventoryRequest.StockMovementRequest.builder()
                    .itemId(testItem.getId())
                    .quantity(48)
                    .type(StockMovement.MovementType.ADJUSTMENT)
                    .reason("Audit correction")
                    .build();

            when(itemRepository.findById(testItem.getId())).thenReturn(Optional.of(testItem));
            when(itemRepository.save(any(InventoryItem.class))).thenReturn(testItem);
            when(movementRepository.save(any(StockMovement.class))).thenAnswer(invocation -> {
                StockMovement sm = invocation.getArgument(0);
                sm.setId(UUID.randomUUID());
                sm.setCreatedAt(LocalDateTime.now());
                return sm;
            });

            inventoryService.recordMovement(request);

            ArgumentCaptor<InventoryItem> itemCaptor = ArgumentCaptor.forClass(InventoryItem.class);
            verify(itemRepository).save(itemCaptor.capture());
            assertThat(itemCaptor.getValue().getQuantity()).isEqualTo(48);
        }

        @Test
        @DisplayName("should throw exception when item not found for movement")
        void shouldThrowNotFoundException_whenItemNotFound_givenInvalidItemId() {
            UUID randomId = UUID.randomUUID();
            InventoryRequest.StockMovementRequest request = InventoryRequest.StockMovementRequest.builder()
                    .itemId(randomId)
                    .quantity(10)
                    .type(StockMovement.MovementType.IN)
                    .build();

            when(itemRepository.findById(randomId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> inventoryService.recordMovement(request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("InventoryItem");
        }
    }

    @Nested
    @DisplayName("getLowStockItems")
    class GetLowStockItemsTests {

        @Test
        @DisplayName("should return items where quantity <= minimum_quantity")
        void shouldReturnLowStockItems_whenQuantityBelowMinimum_givenItemsInStock() {
            InventoryItem lowItem = InventoryItem.builder()
                    .name("USB Cable")
                    .quantity(5)
                    .minimumQuantity(10)
                    .tenantId(tenantId)
                    .build();
            lowItem.setId(UUID.randomUUID());
            lowItem.setCreatedAt(LocalDateTime.now());

            when(itemRepository.findLowStockItems(tenantId)).thenReturn(List.of(lowItem));

            List<InventoryResponse.ItemResponse> lowStock = inventoryService.getLowStockItems();

            assertThat(lowStock).hasSize(1);
            assertThat(lowStock.get(0).getName()).isEqualTo("USB Cable");
            assertThat(lowStock.get(0).getQuantity()).isLessThanOrEqualTo(lowStock.get(0).getMinimumQuantity());
        }
    }

    @Nested
    @DisplayName("createAsset")
    class CreateAssetTests {

        @Test
        @DisplayName("should create asset with lifecycle fields")
        void shouldCreateAsset_whenValidRequest_givenAllFields() {
            InventoryRequest.AssetRequest request = InventoryRequest.AssetRequest.builder()
                    .name("MacBook Pro 16\"")
                    .description("Developer laptop")
                    .assetTag("AST-2026-001")
                    .type(Asset.AssetType.HARDWARE)
                    .purchasePrice(new BigDecimal("2499.99"))
                    .purchaseDate(LocalDateTime.now().minusDays(30))
                    .warrantyExpiry(LocalDateTime.now().plusYears(3))
                    .assignedTo("developer-01")
                    .build();

            when(assetRepository.save(any(Asset.class))).thenAnswer(invocation -> {
                Asset asset = invocation.getArgument(0);
                asset.setId(UUID.randomUUID());
                asset.setCreatedAt(LocalDateTime.now());
                asset.setUpdatedAt(LocalDateTime.now());
                return asset;
            });

            InventoryResponse.AssetResponse response = inventoryService.createAsset(request);

            assertThat(response).isNotNull();
            assertThat(response.getName()).isEqualTo("MacBook Pro 16\"");
            assertThat(response.getAssetTag()).isEqualTo("AST-2026-001");
            assertThat(response.getStatus()).isEqualTo("AVAILABLE");
        }
    }
}
