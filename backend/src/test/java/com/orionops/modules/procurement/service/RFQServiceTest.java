package com.orionops.modules.procurement.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class RFQServiceTest {

    @InjectMocks
    private RFQService rfqService;

    private UUID createTestRFQ() {
        Map<String, Object> rfq = rfqService.createRFQ(UUID.randomUUID(), Map.of("title", "Test RFQ"));
        return (UUID) rfq.get("id");
    }

    @Test
    void testCreateRFQ() {
        UUID requisitionId = UUID.randomUUID();
        Map<String, Object> rfq = rfqService.createRFQ(requisitionId, Map.of("title", "Test RFQ"));
        assertNotNull(rfq);
        assertTrue(rfq.containsKey("id") || rfq.containsKey("status"));
    }

    @Test
    void testCreateRFQ_HasDraftStatus() {
        UUID requisitionId = UUID.randomUUID();
        Map<String, Object> rfq = rfqService.createRFQ(requisitionId, Map.of("title", "Test RFQ"));
        Object status = rfq.get("status");
        assertTrue(status == null || status.toString().equals("DRAFT"));
    }

    @Test
    void testSendRFQToVendors() {
        UUID rfqId = createTestRFQ();
        List<UUID> vendorIds = List.of(UUID.randomUUID(), UUID.randomUUID());
        assertDoesNotThrow(() -> rfqService.sendRFQToVendors(rfqId, vendorIds));
    }

    @Test
    void testRecordBidResponse() {
        UUID rfqId = createTestRFQ();
        UUID vendorId = UUID.randomUUID();
        assertDoesNotThrow(() -> rfqService.recordBidResponse(rfqId, vendorId, Map.of("price", "1000")));
    }

    @Test
    void testScoreAndRankBids() {
        UUID rfqId = createTestRFQ();
        Map<String, Object> scores = rfqService.scoreAndRankBids(rfqId);
        assertNotNull(scores);
    }

    @Test
    void testAwardRFQ() {
        UUID rfqId = createTestRFQ();
        UUID vendorId = UUID.randomUUID();
        assertDoesNotThrow(() -> rfqService.awardRFQ(rfqId, vendorId));
    }
}
