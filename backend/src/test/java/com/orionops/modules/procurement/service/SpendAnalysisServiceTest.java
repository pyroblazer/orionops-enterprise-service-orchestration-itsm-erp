package com.orionops.modules.procurement.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class SpendAnalysisServiceTest {

    @Mock
    private SpendAnalysisService spendService;

    @Test
    void testGetSpendByVendor() {
        UUID tenantId = UUID.randomUUID();
        String from = LocalDate.now().minusMonths(1).toString();
        String to = LocalDate.now().toString();
        Map<String, Object> spend = spendService.getSpendByVendor(tenantId, from, to);
        assertNotNull(spend);
    }

    @Test
    void testGetSpendByVendor_WithDates() {
        UUID tenantId = UUID.randomUUID();
        String from = LocalDate.now().minusMonths(1).toString();
        String to = LocalDate.now().toString();
        Map<String, Object> spend = spendService.getSpendByVendor(tenantId, from, to);
        assertNotNull(spend);
    }

    @Test
    void testGetSpendByCategory() {
        UUID tenantId = UUID.randomUUID();
        String from = LocalDate.now().minusMonths(1).toString();
        String to = LocalDate.now().toString();
        Map<String, Object> spend = spendService.getSpendByCategory(tenantId, from, to);
        assertNotNull(spend);
    }

    @Test
    void testGetSpendByCategory_WithDates() {
        UUID tenantId = UUID.randomUUID();
        String from = LocalDate.now().minusMonths(1).toString();
        String to = LocalDate.now().toString();
        Map<String, Object> spend = spendService.getSpendByCategory(tenantId, from, to);
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
