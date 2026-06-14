package com.orionops.modules.procurement.service;

import com.orionops.common.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RFQService {

    private final Map<UUID, Map<String, Object>> rfqs = new HashMap<>();
    private final Map<UUID, List<Map<String, Object>>> bidResponses = new HashMap<>();

    @Transactional
    public Map<String, Object> createRFQ(UUID requisitionId, Map<String, Object> request) {
        UUID rfqId = UUID.randomUUID();
        Map<String, Object> rfq = new HashMap<>(request);
        rfq.put("id", rfqId);
        rfq.put("requisitionId", requisitionId);
        rfq.put("status", "DRAFT");
        rfq.put("createdAt", LocalDateTime.now());
        rfq.put("tenantId", TenantContextHolder.getCurrentTenantId());

        rfqs.put(rfqId, rfq);
        bidResponses.put(rfqId, List.of());

        log.info("RFQ created: {}", rfqId);
        return rfq;
    }

    @Transactional
    public void sendRFQToVendors(UUID rfqId, List<UUID> vendorIds) {
        Map<String, Object> rfq = rfqs.get(rfqId);
        if (rfq == null) throw new RuntimeException("RFQ not found");

        rfq.put("status", "SENT");
        rfq.put("sentAt", LocalDateTime.now());
        rfq.put("vendorCount", vendorIds.size());

        for (UUID vendorId : vendorIds) {
            log.info("RFQ {} sent to vendor {}", rfqId, vendorId);
        }
    }

    @Transactional
    public void recordBidResponse(UUID rfqId, UUID vendorId, Map<String, Object> bidData) {
        List<Map<String, Object>> responses = bidResponses.getOrDefault(rfqId, List.of());
        Map<String, Object> bid = new HashMap<>(bidData);
        bid.put("vendorId", vendorId);
        bid.put("rfqId", rfqId);
        bid.put("submittedAt", LocalDateTime.now());

        responses = new java.util.ArrayList<>(responses);
        responses.add(bid);
        bidResponses.put(rfqId, responses);

        log.info("Bid received from vendor {} for RFQ {}", vendorId, rfqId);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> scoreAndRankBids(UUID rfqId) {
        List<Map<String, Object>> bids = bidResponses.getOrDefault(rfqId, List.of());

        // Multi-criteria scoring: 40% price, 30% delivery, 20% quality, 10% past performance
        List<Map<String, Object>> scoredBids = bids.stream().map(bid -> {
            BigDecimal priceScore = BigDecimal.valueOf(((Number) bid.getOrDefault("price", 0)).doubleValue());
            BigDecimal deliveryScore = BigDecimal.valueOf(((Number) bid.getOrDefault("deliveryDays", 0)).doubleValue());
            BigDecimal qualityScore = BigDecimal.valueOf(((Number) bid.getOrDefault("qualityRating", 0)).doubleValue());

            BigDecimal totalScore = priceScore.multiply(BigDecimal.valueOf(0.4))
                .add(deliveryScore.multiply(BigDecimal.valueOf(0.3)))
                .add(qualityScore.multiply(BigDecimal.valueOf(0.2)));

            bid.put("totalScore", totalScore);
            return bid;
        }).sorted((a, b) -> ((BigDecimal) b.get("totalScore")).compareTo((BigDecimal) a.get("totalScore")))
            .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("rfqId", rfqId);
        result.put("bidCount", scoredBids.size());
        result.put("bids", scoredBids);
        if (!scoredBids.isEmpty()) {
            result.put("winningBid", scoredBids.get(0));
        }
        return result;
    }

    @Transactional
    public void awardRFQ(UUID rfqId, UUID winningVendorId) {
        Map<String, Object> rfq = rfqs.get(rfqId);
        if (rfq == null) throw new RuntimeException("RFQ not found");

        rfq.put("status", "AWARDED");
        rfq.put("awardedTo", winningVendorId);
        rfq.put("awardedAt", LocalDateTime.now());

        log.info("RFQ {} awarded to vendor {}", rfqId, winningVendorId);
    }
}
