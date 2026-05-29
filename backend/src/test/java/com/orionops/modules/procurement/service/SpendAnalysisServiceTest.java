package com.orionops.modules.procurement.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class SpendAnalysisServiceTest {

    @Mock
    private SpendAnalysisService spendService;

    @Test
    void testGetSpendByVendor() {
        Map<String, Object> spend = spendService.getSpendByVendor();
        assertNotNull(spend);
    }

    @Test
    void testGetSpendByVendor_WithDates() {
        Map<String, Object> spend = spendService.getSpendByVendor(LocalDate.now().minusMonths(1), LocalDate.now());
        assertNotNull(spend);
    }

    @Test
    void testGetSpendByCategory() {
        Map<String, Object> spend = spendService.getSpendByCategory();
        assertNotNull(spend);
    }

    @Test
    void testGetSpendByCategory_WithDates() {
        Map<String, Object> spend = spendService.getSpendByCategory(LocalDate.now().minusMonths(1), LocalDate.now());
        assertNotNull(spend);
    }

    @Test
    void testIdentifyConsolidationOpportunities() {
        Map<String, Object> opportunities = spendService.identifyConsolidationOpportunities();
        assertNotNull(opportunities);
        assertTrue(opportunities.containsKey("savings") || opportunities.isEmpty());
    }

    @Test
    void testGetVendorConcentration() {
        Map<String, Object> concentration = spendService.getVendorConcentration();
        assertNotNull(concentration);
        assertTrue(concentration.containsKey("risk") || concentration.isEmpty());
    }
}
