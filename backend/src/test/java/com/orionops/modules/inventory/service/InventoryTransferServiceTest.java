package com.orionops.modules.inventory.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;

/**
 * Unit tests for {@link InventoryTransferService}.
 * Tests verify real return values and method execution.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("InventoryTransferService")
class InventoryTransferServiceTest {

    @InjectMocks
    private InventoryTransferService transferService;

    @Nested
    @DisplayName("createTransfer")
    class CreateTransferTests {

        @Test
        @DisplayName("should return PENDING status")
        void shouldReturn_pendingStatus() {
            Map<String, Object> transfer = transferService.createTransfer(
                    UUID.randomUUID(), UUID.randomUUID(), "SKU-001", BigDecimal.valueOf(100));

            assertThat(transfer).containsEntry("status", "PENDING");
        }

        @Test
        @DisplayName("should include all fields")
        void shouldInclude_allFields() {
            UUID from = UUID.randomUUID();
            UUID to = UUID.randomUUID();

            Map<String, Object> transfer = transferService.createTransfer(from, to, "SKU-001", BigDecimal.valueOf(100));

            assertThat(transfer).containsEntry("fromWarehouse", from);
            assertThat(transfer).containsEntry("toWarehouse", to);
            assertThat(transfer).containsEntry("sku", "SKU-001");
            assertThat(transfer).containsEntry("quantity", BigDecimal.valueOf(100));
        }

        @Test
        @DisplayName("should generate transfer ID")
        void shouldGenerate_id() {
            Map<String, Object> transfer = transferService.createTransfer(
                    UUID.randomUUID(), UUID.randomUUID(), "SKU-001", BigDecimal.TEN);

            assertThat(transfer).containsKey("id");
            assertThat(transfer.get("id")).isInstanceOf(UUID.class);
        }
    }

    @Nested
    @DisplayName("recordTransitTransfer")
    class RecordTransitTransferTests {

        @Test
        @DisplayName("should execute without error")
        void shouldExecute_withoutError() {
            assertThatNoException().isThrownBy(() ->
                    transferService.recordTransitTransfer(UUID.randomUUID()));
        }
    }

    @Nested
    @DisplayName("receiveTransfer")
    class ReceiveTransferTests {

        @Test
        @DisplayName("should execute without error")
        void shouldExecute_withoutError() {
            assertThatNoException().isThrownBy(() ->
                    transferService.receiveTransfer(UUID.randomUUID(), BigDecimal.valueOf(100)));
        }
    }

    @Nested
    @DisplayName("getBinSuggestion")
    class GetBinSuggestionTests {

        @Test
        @DisplayName("should return suggestion with expected keys")
        void shouldReturn_suggestion() {
            Map<String, Object> suggestion = transferService.getBinSuggestion("SKU-001", UUID.randomUUID());

            assertThat(suggestion).containsKeys("sku", "suggestedBin", "reason");
            assertThat(suggestion).containsEntry("sku", "SKU-001");
        }
    }
}
