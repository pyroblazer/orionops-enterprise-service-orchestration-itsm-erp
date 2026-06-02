package com.orionops.modules.procurement.service;

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
 * Unit tests for {@link ThreeWayMatchingService}.
 * Stateless service — no mocks needed. Tests verify real method behavior.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ThreeWayMatchingService")
class ThreeWayMatchingServiceTest {

    @InjectMocks
    private ThreeWayMatchingService matchingService;

    @Nested
    @DisplayName("recordGoodsReceipt")
    class RecordGoodsReceiptTests {

        @Test
        @DisplayName("should execute without error")
        void shouldExecute_withoutError() {
            assertThatNoException().isThrownBy(() ->
                    matchingService.recordGoodsReceipt(UUID.randomUUID(), Map.of("quantity", 10)));
        }
    }

    @Nested
    @DisplayName("matchInvoiceToReceiptAndPO")
    class MatchInvoiceTests {

        @Test
        @DisplayName("should execute without error")
        void shouldExecute_withoutError() {
            assertThatNoException().isThrownBy(() ->
                    matchingService.matchInvoiceToReceiptAndPO(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID()));
        }
    }

    @Nested
    @DisplayName("detectVariances")
    class DetectVariancesTests {

        @Test
        @DisplayName("should return variance map with expected keys")
        void shouldReturn_varianceMap() {
            Map<String, Object> variances = matchingService.detectVariances(UUID.randomUUID());

            assertThat(variances).containsKeys("priceVariance", "quantityVariance", "hasVariance");
        }

        @Test
        @DisplayName("should report no variance by default")
        void shouldReturnNoVariance_byDefault() {
            Map<String, Object> variances = matchingService.detectVariances(UUID.randomUUID());

            assertThat(variances).containsEntry("hasVariance", false);
            assertThat((BigDecimal) variances.get("priceVariance")).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat((BigDecimal) variances.get("quantityVariance")).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("flagMatchingException")
    class FlagMatchingExceptionTests {

        @Test
        @DisplayName("should execute without error")
        void shouldExecute_withoutError() {
            assertThatNoException().isThrownBy(() ->
                    matchingService.flagMatchingException(UUID.randomUUID(), "QUANTITY_VARIANCE"));
        }
    }

    @Nested
    @DisplayName("resolveVariance")
    class ResolveVarianceTests {

        @Test
        @DisplayName("should execute without error")
        void shouldExecute_withoutError() {
            assertThatNoException().isThrownBy(() ->
                    matchingService.resolveVariance(UUID.randomUUID(), "APPROVED"));
        }
    }
}
