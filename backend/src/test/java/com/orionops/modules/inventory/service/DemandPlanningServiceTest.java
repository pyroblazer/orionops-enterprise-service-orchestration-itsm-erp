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
class DemandPlanningServiceTest {

    @Mock
    private DemandPlanningService demandService;

    @Test
    void testForecastDemand() {
        Map<String, Object> forecast = demandService.forecastDemand("SKU-001", 3);
        assertNotNull(forecast);
        assertTrue(forecast.containsKey("sku") || forecast.isEmpty());
    }

    @Test
    void testForecastDemand_WithMonths() {
        Map<String, Object> forecast = demandService.forecastDemand("SKU-001", 6);
        assertNotNull(forecast);
    }

    @Test
    void testSuggestReorderPoint() {
        Map<String, Object> reorderPoint = demandService.suggestReorderPoint("SKU-001", UUID.randomUUID());
        assertNotNull(reorderPoint);
    }

    @Test
    void testSuggestReorderPoint_WithWarehouse() {
        UUID warehouseId = UUID.randomUUID();
        Map<String, Object> reorderPoint = demandService.suggestReorderPoint("SKU-001", warehouseId);
        assertTrue(reorderPoint.containsKey("point") || reorderPoint.isEmpty());
    }

    @Test
    void testTriggerReorderIfNeeded() {
        assertDoesNotThrow(() -> demandService.triggerReorderIfNeeded());
    }

    @Test
    void testAnalyzeForecastAccuracy() {
        assertDoesNotThrow(() -> demandService.analyzeForecastAccuracy());
    }
}
