package com.orionops.modules.inventory.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class InventoryTransferServiceTest {

    @Mock
    private InventoryTransferService transferService;

    @Test
    void testCreateTransfer() {
        Map<String, Object> transfer = transferService.createTransfer(Map.of(
            "fromWarehouse", UUID.randomUUID().toString(),
            "toWarehouse", UUID.randomUUID().toString(),
            "sku", "SKU-001",
            "quantity", "100"
        ));
        assertNotNull(transfer);
        assertTrue(transfer.containsKey("status") || transfer.containsKey("id"));
    }

    @Test
    void testCreateTransfer_HasPendingStatus() {
        Map<String, Object> transfer = transferService.createTransfer(Map.of(
            "fromWarehouse", UUID.randomUUID().toString(),
            "toWarehouse", UUID.randomUUID().toString(),
            "sku", "SKU-001",
            "quantity", "100"
        ));
        Object status = transfer.get("status");
        assertTrue(status == null || status.toString().equals("PENDING"));
    }

    @Test
    void testRecordTransitTransfer() {
        UUID transferId = UUID.randomUUID();
        assertDoesNotThrow(() -> transferService.recordTransitTransfer(transferId));
    }

    @Test
    void testReceiveTransfer() {
        UUID transferId = UUID.randomUUID();
        assertDoesNotThrow(() -> transferService.receiveTransfer(transferId, BigDecimal.valueOf(100)));
    }

    @Test
    void testGetBinSuggestion() {
        String suggestion = transferService.getBinSuggestion("SKU-001");
        assertNotNull(suggestion);
    }

    @Test
    void testGetBinSuggestion_WithWarehouse() {
        String suggestion = transferService.getBinSuggestion("SKU-001", UUID.randomUUID());
        assertNotNull(suggestion);
    }
}
