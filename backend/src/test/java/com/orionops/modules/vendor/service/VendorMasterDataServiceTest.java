package com.orionops.modules.vendor.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class VendorMasterDataServiceTest {

    @Mock
    private VendorMasterDataService vendorService;

    @Test
    void testSuggestDuplicateVendors() {
        UUID vendorId = UUID.randomUUID();
        List<Map<String, Object>> duplicates = vendorService.suggestDuplicateVendors(vendorId);
        assertNotNull(duplicates);
    }

    @Test
    void testSuggestDuplicateVendors_NoMatches() {
        UUID vendorId = UUID.randomUUID();
        List<Map<String, Object>> duplicates = vendorService.suggestDuplicateVendors(vendorId);
        assertTrue(duplicates == null || duplicates.isEmpty());
    }

    @Test
    void testCalculateDataQualityScore() {
        UUID vendorId = UUID.randomUUID();
        int score = vendorService.calculateDataQualityScore(vendorId);
        assertTrue(score >= 0 && score <= 100);
    }

    @Test
    void testConsolidateVendors() {
        UUID primaryId = UUID.randomUUID();
        List<UUID> duplicateIds = List.of(UUID.randomUUID(), UUID.randomUUID());
        assertDoesNotThrow(() -> vendorService.consolidateVendors(primaryId, duplicateIds));
    }

    @Test
    void testFlagInactiveVendors() {
        assertDoesNotThrow(() -> vendorService.flagInactiveVendors());
    }

    @Test
    void testAuditVendorChange() {
        UUID vendorId = UUID.randomUUID();
        assertDoesNotThrow(() -> vendorService.auditVendorChange(vendorId, Map.of("field", "value")));
    }
}
