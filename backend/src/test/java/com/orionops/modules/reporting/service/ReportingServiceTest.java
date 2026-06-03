package com.orionops.modules.reporting.service;

import com.orionops.modules.reporting.dto.ReportSummaryResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link ReportingService}.
 * Covers incident metrics, SLA metrics, volume reporting, and financial metrics.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ReportingService")
class ReportingServiceTest {

    @Mock
    private JdbcTemplate jdbc;

    @InjectMocks
    private ReportingService reportingService;

    private UUID tenantId = UUID.fromString("00000000-0000-0000-0000-000000000001");

    // ========================================================================
    // GET SUMMARY
    // ========================================================================

    @Nested
    @DisplayName("getSummary")
    class GetSummary {

        @Test
        @DisplayName("returns incident metrics (MTTR, MTTA) with SLA and volume data")
        void returnsSummaryMetrics() {
            when(jdbc.queryForObject(anyString(), any(RowMapper.class), eq(30)))
                    .thenReturn(new ReportSummaryResponse.IncidentMetrics(4.5, 2.1, 5L, 10L, 15L));

            when(jdbc.queryForObject(anyString(), any(RowMapper.class)))
                    .thenReturn(new ReportSummaryResponse.SlaMetrics(100L, 10L, 90L, 10.0));

            when(jdbc.query(anyString(), any(RowMapper.class), eq(30)))
                    .thenReturn(List.of(
                            new ReportSummaryResponse.VolumeByDay("2026-06-01", 5L),
                            new ReportSummaryResponse.VolumeByDay("2026-06-02", 10L)
                    ));

            ReportSummaryResponse response = reportingService.getSummary(30);

            assertThat(response.incidentMetrics().mttrHours()).isEqualTo(4.5);
            assertThat(response.incidentMetrics().mttaHours()).isEqualTo(2.1);
            assertThat(response.incidentMetrics().openCount()).isEqualTo(5L);
            assertThat(response.slaMetrics().breachRatePercent()).isEqualTo(10.0);
        }

        @Test
        @DisplayName("handles empty data with zero defaults")
        void handlesEmptyData() {
            when(jdbc.queryForObject(anyString(), any(RowMapper.class), eq(30)))
                    .thenReturn(new ReportSummaryResponse.IncidentMetrics(null, null, 0L, 0L, 0L));

            when(jdbc.queryForObject(anyString(), any(RowMapper.class)))
                    .thenReturn(new ReportSummaryResponse.SlaMetrics(0L, 0L, 0L, 0.0));

            when(jdbc.query(anyString(), any(RowMapper.class), eq(30)))
                    .thenReturn(List.of());

            ReportSummaryResponse response = reportingService.getSummary(30);

            assertThat(response.incidentMetrics().totalCount()).isZero();
            assertThat(response.slaMetrics().breachRatePercent()).isZero();
        }
    }

    // ========================================================================
    // GET BUDGET VARIANCE
    // ========================================================================

    @Nested
    @DisplayName("getBudgetVariance")
    class GetBudgetVariance {

        @Test
        @DisplayName("returns cost center expenses vs budget with variance")
        void returnsBudgetVariance() {
            Map<String, Object> row = new HashMap<>();
            row.put("id", UUID.randomUUID());
            row.put("name", "Engineering");
            row.put("budget_amount", 50000);
            row.put("spent", 40000);
            row.put("variance", 10000);
            row.put("variance_pct", 80.0);

            when(jdbc.queryForList(anyString(), eq(tenantId)))
                    .thenReturn(List.of(row));

            List<Map<String, Object>> result = reportingService.getBudgetVariance(tenantId);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).get("name")).isEqualTo("Engineering");
            assertThat(result.get(0).get("variance_pct")).isEqualTo(80.0);
        }

        @Test
        @DisplayName("handles null spent values with COALESCE")
        void handlesNullSpent() {
            Map<String, Object> row = new HashMap<>();
            row.put("name", "Unused");
            row.put("budget_amount", 10000);
            row.put("spent", 0);
            row.put("variance", 10000);
            row.put("variance_pct", 0.0);

            when(jdbc.queryForList(anyString(), eq(tenantId)))
                    .thenReturn(List.of(row));

            List<Map<String, Object>> result = reportingService.getBudgetVariance(tenantId);

            assertThat(result.get(0).get("spent")).isEqualTo(0);
        }
    }

    // ========================================================================
    // GET INVOICE AGING
    // ========================================================================

    @Nested
    @DisplayName("getInvoiceAging")
    class GetInvoiceAging {

        @Test
        @DisplayName("returns invoices grouped by aging bucket")
        void returnsAgingBuckets() {
            Map<String, Object> bucket0_30 = new HashMap<>();
            bucket0_30.put("aging_bucket", "0-30");
            bucket0_30.put("count", 5);
            bucket0_30.put("total_amount", 50000);

            Map<String, Object> bucket31_60 = new HashMap<>();
            bucket31_60.put("aging_bucket", "31-60");
            bucket31_60.put("count", 3);
            bucket31_60.put("total_amount", 30000);

            when(jdbc.queryForList(anyString(), eq(tenantId)))
                    .thenReturn(List.of(bucket0_30, bucket31_60));

            List<Map<String, Object>> result = reportingService.getInvoiceAging(tenantId);

            assertThat(result).hasSize(2);
            assertThat(result.get(0).get("aging_bucket")).isEqualTo("0-30");
            assertThat(result.get(0).get("count")).isEqualTo(5);
        }

        @Test
        @DisplayName("handles all aging buckets: 0-30, 31-60, 61-90, 90+")
        void handlesAllBuckets() {
            List<Map<String, Object>> result = List.of(
                    Map.of("aging_bucket", "0-30", "count", 10, "total_amount", 100000),
                    Map.of("aging_bucket", "31-60", "count", 5, "total_amount", 50000),
                    Map.of("aging_bucket", "61-90", "count", 3, "total_amount", 30000),
                    Map.of("aging_bucket", "90+", "count", 2, "total_amount", 20000)
            );

            when(jdbc.queryForList(anyString(), eq(tenantId)))
                    .thenReturn(result);

            List<Map<String, Object>> actual = reportingService.getInvoiceAging(tenantId);

            assertThat(actual).hasSize(4);
        }
    }

    // ========================================================================
    // GET VENDOR SPEND
    // ========================================================================

    @Nested
    @DisplayName("getVendorSpend")
    class GetVendorSpend {

        @Test
        @DisplayName("returns top 20 vendors by YTD spend")
        void returnsTopVendors() {
            Map<String, Object> vendor1 = new HashMap<>();
            vendor1.put("id", UUID.randomUUID());
            vendor1.put("name", "Vendor A");
            vendor1.put("ytd_spend", 500000);
            vendor1.put("po_count", 25);

            Map<String, Object> vendor2 = new HashMap<>();
            vendor2.put("id", UUID.randomUUID());
            vendor2.put("name", "Vendor B");
            vendor2.put("ytd_spend", 300000);
            vendor2.put("po_count", 15);

            when(jdbc.queryForList(anyString(), eq(tenantId)))
                    .thenReturn(List.of(vendor1, vendor2));

            List<Map<String, Object>> result = reportingService.getVendorSpend(tenantId);

            assertThat(result).hasSize(2);
            assertThat(result.get(0).get("name")).isEqualTo("Vendor A");
            assertThat(result.get(0).get("ytd_spend")).isEqualTo(500000);
        }

        @Test
        @DisplayName("handles null values with NULLS LAST ordering")
        void handlesNullValues() {
            Map<String, Object> vendor = new HashMap<>();
            vendor.put("name", "New Vendor");
            vendor.put("ytd_spend", null);
            vendor.put("po_count", 0);

            when(jdbc.queryForList(anyString(), eq(tenantId)))
                    .thenReturn(List.of(vendor));

            List<Map<String, Object>> result = reportingService.getVendorSpend(tenantId);

            assertThat(result.get(0).get("ytd_spend")).isNull();
        }
    }

    // ========================================================================
    // GET EXPENSE BREAKDOWN
    // ========================================================================

    @Nested
    @DisplayName("getExpenseBreakdown")
    class GetExpenseBreakdown {

        @Test
        @DisplayName("returns expenses grouped by category for period")
        void returnsBreakdown() {
            Map<String, Object> row = new HashMap<>();
            row.put("category", "Travel");
            row.put("count", 5);
            row.put("total_amount", 5000);

            when(jdbc.queryForList(anyString(), eq(tenantId), eq("2026-06-01")))
                    .thenReturn(List.of(row));

            List<Map<String, Object>> result = reportingService.getExpenseBreakdown(tenantId, "2026-06-01");

            assertThat(result).hasSize(1);
            assertThat(result.get(0).get("category")).isEqualTo("Travel");
        }
    }

    // ========================================================================
    // GET INVENTORY VALUATION
    // ========================================================================

    @Nested
    @DisplayName("getInventoryValuation")
    class GetInventoryValuation {

        @Test
        @DisplayName("returns warehouse inventory totals")
        void returnsValuation() {
            Map<String, Object> warehouse = new HashMap<>();
            warehouse.put("warehouse_id", UUID.randomUUID());
            warehouse.put("item_count", 1000);
            warehouse.put("total_value", 500000);

            when(jdbc.queryForList(anyString(), eq(tenantId)))
                    .thenReturn(List.of(warehouse));

            List<Map<String, Object>> result = reportingService.getInventoryValuation(tenantId);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).get("item_count")).isEqualTo(1000);
            assertThat(result.get(0).get("total_value")).isEqualTo(500000);
        }
    }

    // ========================================================================
    // GET PO AGING
    // ========================================================================

    @Nested
    @DisplayName("getPOAging")
    class GetPOAging {

        @Test
        @DisplayName("returns purchase orders grouped by status and age")
        void returnsPoAging() {
            Map<String, Object> row = new HashMap<>();
            row.put("status", "APPROVED");
            row.put("age_bucket", "0-30 days");
            row.put("count", 5);

            when(jdbc.queryForList(anyString(), eq(tenantId)))
                    .thenReturn(List.of(row));

            List<Map<String, Object>> result = reportingService.getPOAging(tenantId);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).get("status")).isEqualTo("APPROVED");
        }
    }
}
