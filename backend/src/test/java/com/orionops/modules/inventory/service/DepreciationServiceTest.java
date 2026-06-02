package com.orionops.modules.inventory.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class DepreciationServiceTest {

    @InjectMocks
    private DepreciationService depreciationService;

    @Test
    void testCreateDepreciationSchedule() {
        UUID assetId = UUID.randomUUID();
        Map<String, Object> schedule = depreciationService.createDepreciationSchedule(assetId);
        assertNotNull(schedule);
        assertEquals(assetId, schedule.get("assetId"));
        assertEquals("STRAIGHT_LINE", schedule.get("depreciationMethod"));
    }

    @Test
    void testGetDepreciationExpense() {
        UUID assetId = UUID.randomUUID();
        BigDecimal expense = depreciationService.getDepreciationExpense(assetId,
            java.time.YearMonth.now());
        assertNotNull(expense);
        assertTrue(expense.compareTo(BigDecimal.ZERO) >= 0);
    }

    @Test
    void testGetBookValue() {
        UUID assetId = UUID.randomUUID();
        BigDecimal bookValue = depreciationService.getBookValue(assetId, LocalDate.now());
        assertNotNull(bookValue);
        assertTrue(bookValue.compareTo(BigDecimal.ZERO) >= 0);
    }

    @Test
    void testRecordAssetDisposal() {
        UUID assetId = UUID.randomUUID();
        assertDoesNotThrow(() ->
            depreciationService.recordAssetDisposal(assetId, LocalDate.now(), BigDecimal.TEN));
    }
}
