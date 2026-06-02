package com.orionops.modules.procurement.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for {@link RFQService}.
 * RFQService uses in-memory HashMaps — no mocks needed.
 * Tests verify real state changes and bid scoring calculations.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("RFQService")
class RFQServiceTest {

    @InjectMocks
    private RFQService rfqService;

    @Nested
    @DisplayName("createRFQ")
    class CreateRFQTests {

        @Test
        @DisplayName("should create RFQ with DRAFT status")
        void shouldCreate_withDraftStatus() {
            Map<String, Object> rfq = rfqService.createRFQ(UUID.randomUUID(), Map.of("title", "Server Purchase"));

            assertThat(rfq).containsEntry("status", "DRAFT");
            assertThat(rfq).containsKey("id");
            assertThat(rfq.get("id")).isInstanceOf(UUID.class);
        }

        @Test
        @DisplayName("should store requisition ID")
        void shouldStoreRequisitionId() {
            UUID requisitionId = UUID.randomUUID();
            Map<String, Object> rfq = rfqService.createRFQ(requisitionId, Map.of("title", "Test"));

            assertThat(rfq).containsEntry("requisitionId", requisitionId);
        }

        @Test
        @DisplayName("should set tenantId")
        void shouldSetTenantId() {
            Map<String, Object> rfq = rfqService.createRFQ(UUID.randomUUID(), Map.of("title", "Test"));

            assertThat(rfq).containsKey("tenantId");
            assertThat(rfq.get("tenantId")).isNotNull();
        }
    }

    @Nested
    @DisplayName("sendRFQToVendors")
    class SendRFQToVendorsTests {

        @Test
        @DisplayName("should update status to SENT and set vendor count")
        void shouldUpdateStatus_toSent() {
            Map<String, Object> rfq = rfqService.createRFQ(UUID.randomUUID(), Map.of("title", "Test"));
            UUID rfqId = (UUID) rfq.get("id");

            List<UUID> vendorIds = List.of(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID());
            rfqService.sendRFQToVendors(rfqId, vendorIds);

            // Verify state was mutated on the RFQ
            assertThat(rfq).containsEntry("status", "SENT");
            assertThat(rfq).containsEntry("vendorCount", 3);
        }

        @Test
        @DisplayName("should throw when RFQ not found")
        void shouldThrow_whenRFQNotFound() {
            assertThatThrownBy(() -> rfqService.sendRFQToVendors(UUID.randomUUID(), List.of()))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("RFQ not found");
        }
    }

    @Nested
    @DisplayName("recordBidResponse")
    class RecordBidResponseTests {

        @Test
        @DisplayName("should accumulate bids from multiple vendors")
        void shouldAccumulate_bids() {
            Map<String, Object> rfq = rfqService.createRFQ(UUID.randomUUID(), Map.of("title", "Test"));
            UUID rfqId = (UUID) rfq.get("id");

            UUID vendor1 = UUID.randomUUID();
            UUID vendor2 = UUID.randomUUID();
            rfqService.recordBidResponse(rfqId, vendor1, Map.of("price", 100, "deliveryDays", 5));
            rfqService.recordBidResponse(rfqId, vendor2, Map.of("price", 90, "deliveryDays", 7));

            Map<String, Object> scored = rfqService.scoreAndRankBids(rfqId);

            assertThat(scored).containsEntry("bidCount", 2);
            List<?> bids = (List<?>) scored.get("bids");
            assertThat(bids).hasSize(2);
        }

        @Test
        @DisplayName("should include vendorId in stored bid")
        void shouldInclude_vendorId() {
            Map<String, Object> rfq = rfqService.createRFQ(UUID.randomUUID(), Map.of("title", "Test"));
            UUID rfqId = (UUID) rfq.get("id");
            UUID vendorId = UUID.randomUUID();

            rfqService.recordBidResponse(rfqId, vendorId, Map.of("price", 100));

            Map<String, Object> scored = rfqService.scoreAndRankBids(rfqId);
            List<Map<String, Object>> bids = (List<Map<String, Object>>) scored.get("bids");
            assertThat(bids.get(0)).containsEntry("vendorId", vendorId);
        }
    }

    @Nested
    @DisplayName("scoreAndRankBids")
    class ScoreAndRankBidsTests {

        @Test
        @DisplayName("should score with 40/30/20 weights for price/delivery/quality")
        void shouldScore_withCorrectWeights() {
            Map<String, Object> rfq = rfqService.createRFQ(UUID.randomUUID(), Map.of("title", "Test"));
            UUID rfqId = (UUID) rfq.get("id");

            rfqService.recordBidResponse(rfqId, UUID.randomUUID(),
                    Map.of("price", 80, "deliveryDays", 9, "qualityRating", 7));

            Map<String, Object> result = rfqService.scoreAndRankBids(rfqId);
            List<Map<String, Object>> bids = (List<Map<String, Object>>) result.get("bids");

            BigDecimal totalScore = (BigDecimal) bids.get(0).get("totalScore");
            // 80*0.4 + 9*0.3 + 7*0.2 = 32.0 + 2.7 + 1.4 = 36.1
            BigDecimal expected = BigDecimal.valueOf(80).multiply(BigDecimal.valueOf(0.4))
                    .add(BigDecimal.valueOf(9).multiply(BigDecimal.valueOf(0.3)))
                    .add(BigDecimal.valueOf(7).multiply(BigDecimal.valueOf(0.2)));
            assertThat(totalScore).isEqualByComparingTo(expected);
        }

        @Test
        @DisplayName("should sort bids descending by total score")
        void shouldSort_descendingByScore() {
            Map<String, Object> rfq = rfqService.createRFQ(UUID.randomUUID(), Map.of("title", "Test"));
            UUID rfqId = (UUID) rfq.get("id");

            // Lower scores first
            rfqService.recordBidResponse(rfqId, UUID.randomUUID(),
                    Map.of("price", 50, "deliveryDays", 5, "qualityRating", 5));
            // Higher scores second
            rfqService.recordBidResponse(rfqId, UUID.randomUUID(),
                    Map.of("price", 90, "deliveryDays", 9, "qualityRating", 9));

            Map<String, Object> result = rfqService.scoreAndRankBids(rfqId);
            List<Map<String, Object>> bids = (List<Map<String, Object>>) result.get("bids");

            BigDecimal firstScore = (BigDecimal) bids.get(0).get("totalScore");
            BigDecimal secondScore = (BigDecimal) bids.get(1).get("totalScore");
            assertThat(firstScore).isGreaterThan(secondScore);
        }

        @Test
        @DisplayName("should not have winningBid when no bids exist")
        void shouldNotHaveWinningBid_whenNoBids() {
            Map<String, Object> rfq = rfqService.createRFQ(UUID.randomUUID(), Map.of("title", "Test"));
            UUID rfqId = (UUID) rfq.get("id");

            Map<String, Object> result = rfqService.scoreAndRankBids(rfqId);

            assertThat(result).containsEntry("bidCount", 0);
            assertThat(result).doesNotContainKey("winningBid");
        }

        @Test
        @DisplayName("should return winningBid as highest-scoring bid")
        void shouldReturn_winningBid() {
            Map<String, Object> rfq = rfqService.createRFQ(UUID.randomUUID(), Map.of("title", "Test"));
            UUID rfqId = (UUID) rfq.get("id");
            UUID winnerVendor = UUID.randomUUID();

            rfqService.recordBidResponse(rfqId, winnerVendor,
                    Map.of("price", 100, "deliveryDays", 10, "qualityRating", 10));
            rfqService.recordBidResponse(rfqId, UUID.randomUUID(),
                    Map.of("price", 10, "deliveryDays", 1, "qualityRating", 1));

            Map<String, Object> result = rfqService.scoreAndRankBids(rfqId);

            Map<String, Object> winningBid = (Map<String, Object>) result.get("winningBid");
            assertThat(winningBid).isNotNull();
            assertThat(winningBid).containsEntry("vendorId", winnerVendor);
        }
    }

    @Nested
    @DisplayName("awardRFQ")
    class AwardRFQTests {

        @Test
        @DisplayName("should set AWARDED status and awardedTo vendor")
        void shouldSetAwardedStatus() {
            Map<String, Object> rfq = rfqService.createRFQ(UUID.randomUUID(), Map.of("title", "Test"));
            UUID rfqId = (UUID) rfq.get("id");
            UUID winnerVendor = UUID.randomUUID();

            rfqService.awardRFQ(rfqId, winnerVendor);

            assertThat(rfq).containsEntry("status", "AWARDED");
            assertThat(rfq).containsEntry("awardedTo", winnerVendor);
        }

        @Test
        @DisplayName("should throw when RFQ not found")
        void shouldThrow_whenRFQNotFound() {
            assertThatThrownBy(() -> rfqService.awardRFQ(UUID.randomUUID(), UUID.randomUUID()))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("RFQ not found");
        }
    }
}
