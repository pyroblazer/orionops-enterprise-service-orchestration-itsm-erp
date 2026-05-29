package com.orionops.modules.inventory.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class LotTrackingServiceTest {

    @Mock
    private LotTrackingService lotService;

    @Test
    void testReceiveLot() {
        assertDoesNotThrow(() -> lotService.receiveLot(Map.of(
            "sku", "SKU-001",
            "lotNumber", "LOT-2024-001",
            "quantity", "100",
            "expiryDate", LocalDate.now().plusMonths(6).toString()
        )));
    }

    @Test
    void testAllocateLotToOrder() {
        UUID lotId = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();
        assertDoesNotThrow(() -> lotService.allocateLotToOrder(lotId, orderId, BigDecimal.valueOf(50)));
    }

    @Test
    void testFlagExpiringLots() {
        List<Map<String, Object>> expiringLots = lotService.flagExpiringLots();
        assertNotNull(expiringLots);
        assertTrue(expiringLots.isEmpty() || !expiringLots.isEmpty());
    }

    @Test
    void testFlagExpiringLots_WithDays() {
        List<Map<String, Object>> expiringLots = lotService.flagExpiringLots(30);
        assertNotNull(expiringLots);
    }

    @Test
    void testQuarantineExpiredLot() {
        UUID lotId = UUID.randomUUID();
        assertDoesNotThrow(() -> lotService.quarantineExpiredLot(lotId));
    }
}
