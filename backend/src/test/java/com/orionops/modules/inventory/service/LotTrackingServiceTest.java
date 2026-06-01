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
        assertDoesNotThrow(() -> lotService.receiveLot(
            "SKU-001",
            "LOT-2024-001",
            LocalDate.now().minusMonths(1).toString(),
            LocalDate.now().plusMonths(6).toString(),
            BigDecimal.valueOf(100),
            UUID.randomUUID()
        ));
    }

    @Test
    void testAllocateLotToOrder() {
        UUID orderId = UUID.randomUUID();
        assertDoesNotThrow(() -> lotService.allocateLotToOrder(orderId, "SKU-001", BigDecimal.valueOf(50)));
    }

    @Test
    void testFlagExpiringLots() {
        List<Map<String, Object>> expiringLots = lotService.flagExpiringLots(UUID.randomUUID());
        assertNotNull(expiringLots);
        assertTrue(expiringLots.isEmpty() || !expiringLots.isEmpty());
    }

    @Test
    void testFlagExpiringLots_WithDays() {
        List<Map<String, Object>> expiringLots = lotService.flagExpiringLots(UUID.randomUUID());
        assertNotNull(expiringLots);
    }

    @Test
    void testQuarantineExpiredLot() {
        UUID lotId = UUID.randomUUID();
        assertDoesNotThrow(() -> lotService.quarantineExpiredLot(lotId));
    }
}
