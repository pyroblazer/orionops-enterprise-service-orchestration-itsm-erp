package com.orionops.modules.inventory.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;

/**
 * Unit tests for {@link LotTrackingService}.
 * Stateless service — tests verify real method behavior.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("LotTrackingService")
class LotTrackingServiceTest {

    @InjectMocks
    private LotTrackingService lotService;

    @Nested
    @DisplayName("receiveLot")
    class ReceiveLotTests {

        @Test
        @DisplayName("should execute without error")
        void shouldExecute_withoutError() {
            assertThatNoException().isThrownBy(() ->
                    lotService.receiveLot("SKU-001", "LOT-001", "2024-01-01", "2025-01-01",
                            java.math.BigDecimal.valueOf(100), UUID.randomUUID()));
        }
    }

    @Nested
    @DisplayName("allocateLotToOrder")
    class AllocateLotToOrderTests {

        @Test
        @DisplayName("should execute without error")
        void shouldExecute_withoutError() {
            assertThatNoException().isThrownBy(() ->
                    lotService.allocateLotToOrder(UUID.randomUUID(), "SKU-001", java.math.BigDecimal.valueOf(50)));
        }
    }

    @Nested
    @DisplayName("flagExpiringLots")
    class FlagExpiringLotsTests {

        @Test
        @DisplayName("should return empty list by default")
        void shouldReturn_emptyList() {
            List<Map<String, Object>> expiring = lotService.flagExpiringLots(UUID.randomUUID());

            assertThat(expiring).isNotNull();
            assertThat(expiring).isEmpty();
        }
    }

    @Nested
    @DisplayName("quarantineExpiredLot")
    class QuarantineExpiredLotTests {

        @Test
        @DisplayName("should execute without error")
        void shouldExecute_withoutError() {
            assertThatNoException().isThrownBy(() ->
                    lotService.quarantineExpiredLot(UUID.randomUUID()));
        }
    }
}
