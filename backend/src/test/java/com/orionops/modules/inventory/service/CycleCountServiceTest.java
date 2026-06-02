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
 * Unit tests for {@link CycleCountService}.
 * Stateless service — tests verify real method behavior.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CycleCountService")
class CycleCountServiceTest {

    @InjectMocks
    private CycleCountService cycleCountService;

    @Nested
    @DisplayName("scheduleCycleCounts")
    class ScheduleCycleCountsTests {

        @Test
        @DisplayName("should execute without error")
        void shouldExecute_withoutError() {
            assertThatNoException().isThrownBy(() ->
                    cycleCountService.scheduleCycleCounts(UUID.randomUUID(), Map.of("frequency", "WEEKLY")));
        }
    }

    @Nested
    @DisplayName("recordCycleCount")
    class RecordCycleCountTests {

        @Test
        @DisplayName("should execute without error")
        void shouldExecute_withoutError() {
            assertThatNoException().isThrownBy(() ->
                    cycleCountService.recordCycleCount(UUID.randomUUID(), BigDecimal.valueOf(50), "Physical count"));
        }
    }

    @Nested
    @DisplayName("detectVariances")
    class DetectVariancesTests {

        @Test
        @DisplayName("should return map with expected keys")
        void shouldReturn_varianceMap() {
            UUID countId = UUID.randomUUID();
            Map<String, Object> variances = cycleCountService.detectVariances(countId);

            assertThat(variances).containsKeys("countId", "variance", "status");
        }

        @Test
        @DisplayName("should return OK status by default")
        void shouldReturnOK_byDefault() {
            Map<String, Object> variances = cycleCountService.detectVariances(UUID.randomUUID());

            assertThat(variances).containsEntry("status", "OK");
            assertThat((BigDecimal) variances.get("variance")).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("investigateVariance")
    class InvestigateVarianceTests {

        @Test
        @DisplayName("should execute without error")
        void shouldExecute_withoutError() {
            assertThatNoException().isThrownBy(() ->
                    cycleCountService.investigateVariance(UUID.randomUUID(), "Inventory loss", UUID.randomUUID()));
        }
    }
}
