package com.orionops.modules.procurement.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for {@link SpendAnalysisService}.
 * Tests verify real return values from Map.of() responses.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SpendAnalysisService")
class SpendAnalysisServiceTest {

    @InjectMocks
    private SpendAnalysisService spendService;

    @Nested
    @DisplayName("getSpendByVendor")
    class GetSpendByVendorTests {

        @Test
        @DisplayName("should return map with period and vendors keys")
        void shouldReturn_periodAndVendors() {
            String from = LocalDate.now().minusMonths(1).toString();
            String to = LocalDate.now().toString();

            Map<String, Object> result = spendService.getSpendByVendor(UUID.randomUUID(), from, to);

            assertThat(result).containsKeys("period", "vendors");
            assertThat(result.get("period").toString()).contains(from);
        }
    }

    @Nested
    @DisplayName("getSpendByCategory")
    class GetSpendByCategoryTests {

        @Test
        @DisplayName("should return map with period and categories keys")
        void shouldReturn_periodAndCategories() {
            String from = LocalDate.now().minusMonths(1).toString();
            String to = LocalDate.now().toString();

            Map<String, Object> result = spendService.getSpendByCategory(UUID.randomUUID(), from, to);

            assertThat(result).containsKeys("period", "categories");
        }
    }

    @Nested
    @DisplayName("identifyConsolidationOpportunities")
    class IdentifyConsolidationTests {

        @Test
        @DisplayName("should return map with opportunities and savings keys")
        void shouldReturn_opportunities() {
            Map<String, Object> result = spendService.identifyConsolidationOpportunities();

            assertThat(result).containsKeys("opportunities", "potentialSavings");
        }
    }

    @Nested
    @DisplayName("getVendorConcentration")
    class GetVendorConcentrationTests {

        @Test
        @DisplayName("should return map with top5Vendors and concentrationRisk keys")
        void shouldReturn_risk() {
            Map<String, Object> result = spendService.getVendorConcentration();

            assertThat(result).containsKeys("top5Vendors", "concentrationRisk");
        }
    }
}
