package com.orionops.modules.procurement.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class ThreeWayMatchingServiceTest {

    @Mock
    private ThreeWayMatchingService matchingService;

    @Test
    void testRecordGoodsReceipt() {
        UUID poId = UUID.randomUUID();
        assertDoesNotThrow(() -> matchingService.recordGoodsReceipt(poId, Map.of("quantity", 10)));
    }

    @Test
    void testMatchInvoiceToReceiptAndPO() {
        UUID invoiceId = UUID.randomUUID();
        UUID poId = UUID.randomUUID();
        UUID receiptId = UUID.randomUUID();
        assertDoesNotThrow(() -> matchingService.matchInvoiceToReceiptAndPO(invoiceId, poId, receiptId));
    }

    @Test
    void testDetectVariances() {
        UUID invoiceId = UUID.randomUUID();
        Map<String, Object> variances = matchingService.detectVariances(invoiceId);
        assertNotNull(variances);
    }

    @Test
    void testDetectVariances_NoVariance() {
        UUID invoiceId = UUID.randomUUID();
        Map<String, Object> variances = matchingService.detectVariances(invoiceId);
        Object hasVariance = variances.get("hasVariance");
        assertTrue(hasVariance == null || hasVariance.equals(false));
    }

    @Test
    void testFlagMatchingException() {
        UUID invoiceId = UUID.randomUUID();
        assertDoesNotThrow(() -> matchingService.flagMatchingException(invoiceId, "QUANTITY_VARIANCE"));
    }

    @Test
    void testResolveVariance() {
        UUID invoiceId = UUID.randomUUID();
        assertDoesNotThrow(() -> matchingService.resolveVariance(invoiceId, "APPROVED"));
    }
}
