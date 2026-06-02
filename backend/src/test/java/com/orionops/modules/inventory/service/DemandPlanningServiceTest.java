package com.orionops.modules.inventory.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;

/**
 * Unit tests for {@link DemandPlanningService}.
 * Tests verify real return values from Map.of() responses.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("DemandPlanningService")
class DemandPlanningServiceTest {

    @InjectMocks
    private DemandPlanningService demandService;

    @Nested
    @DisplayName("forecastDemand")
    class ForecastDemandTests {

        @Test
        @DisplayName("should return forecast map with expected keys")
        void shouldReturn_forecastMap() {
            Map<String, Object> forecast = demandService.forecastDemand("SKU-001", 3);

            assertThat(forecast).containsKeys("sku", "forecastMonths", "forecast");
            assertThat(forecast).containsEntry("sku", "SKU-001");
        }

        @Test
        @DisplayName("should reflect months parameter in output")
        void shouldReflect_monthsParam() {
            Map<String, Object> forecast = demandService.forecastDemand("SKU-001", 6);

            assertThat(forecast).containsEntry("forecastMonths", 6);
        }
    }

    @Nested
    @DisplayName("suggestReorderPoint")
    class SuggestReorderPointTests {

        @Test
        @DisplayName("should return reorder point map with expected keys")
        void shouldReturn_reorderPoint() {
            Map<String, Object> result = demandService.suggestReorderPoint("SKU-001", UUID.randomUUID());

            assertThat(result).containsKeys("sku", "reorderPoint", "reorderQuantity");
            assertThat(result).containsEntry("sku", "SKU-001");
        }
    }

    @Nested
    @DisplayName("triggerReorderIfNeeded")
    class TriggerReorderTests {

        @Test
        @DisplayName("should execute without error")
        void shouldExecute_withoutError() {
            assertThatNoException().isThrownBy(() -> demandService.triggerReorderIfNeeded());
        }
    }

    @Nested
    @DisplayName("analyzeForecastAccuracy")
    class AnalyzeForecastAccuracyTests {

        @Test
        @DisplayName("should execute without error")
        void shouldExecute_withoutError() {
            assertThatNoException().isThrownBy(() -> demandService.analyzeForecastAccuracy());
        }
    }
}
