package com.orionops.modules.analytics.service;

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

/**
 * Unit tests for {@link PredictiveAnalyticsService}.
 * Tests verify real return values from Map.of() responses.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PredictiveAnalyticsService")
class PredictiveAnalyticsServiceTest {

    @InjectMocks
    private PredictiveAnalyticsService analyticsService;

    @Nested
    @DisplayName("predictCashFlow")
    class PredictCashFlowTests {

        @Test
        @DisplayName("should return map with period and forecast keys")
        void shouldReturn_periodAndForecast() {
            Map<String, Object> result = analyticsService.predictCashFlow(UUID.randomUUID(), 6);

            assertThat(result).containsKeys("period", "forecast");
        }
    }

    @Nested
    @DisplayName("detectAnomalousTransactions")
    class DetectAnomalousTests {

        @Test
        @DisplayName("should return a list")
        void shouldReturn_list() {
            List<Map<String, Object>> anomalies = analyticsService.detectAnomalousTransactions();

            assertThat(anomalies).isNotNull();
            assertThat(anomalies).isEmpty(); // Returns empty list by default
        }
    }

    @Nested
    @DisplayName("predictVendorBankruptcy")
    class PredictVendorBankruptcyTests {

        @Test
        @DisplayName("should return map with vendorId and bankruptcyRisk")
        void shouldReturn_risk() {
            UUID vendorId = UUID.randomUUID();

            Map<String, Object> result = analyticsService.predictVendorBankruptcy(vendorId);

            assertThat(result).containsEntry("vendorId", vendorId);
            assertThat(result).containsKey("bankruptcyRisk");
        }
    }
}
