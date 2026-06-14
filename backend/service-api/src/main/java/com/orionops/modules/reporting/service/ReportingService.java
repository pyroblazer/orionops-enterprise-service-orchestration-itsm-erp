package com.orionops.modules.reporting.service;

import com.orionops.common.tenant.TenantContextHolder;
import com.orionops.modules.reporting.dto.ReportSummaryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportingService {

    private final JdbcTemplate jdbc;

    public ReportSummaryResponse getSummary(int days) {
        return new ReportSummaryResponse(
            incidentMetrics(days),
            slaMetrics(),
            volumeByDay(days),
            volumeByPriority(days),
            volumeByStatus(days)
        );
    }

    private ReportSummaryResponse.IncidentMetrics incidentMetrics(int days) {
        String sql = """
            SELECT
              AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600)  AS mttr_hours,
              AVG(EXTRACT(EPOCH FROM (assigned_at - created_at)) / 3600)  AS mtta_hours,
              COUNT(*) FILTER (WHERE status NOT IN ('resolved','closed'))  AS open_count,
              COUNT(*) FILTER (WHERE status = 'resolved')                  AS resolved_count,
              COUNT(*)                                                       AS total_count
            FROM incidents
            WHERE created_at >= NOW() - (?::int || ' days')::INTERVAL
            """;
        return jdbc.queryForObject(sql, (rs, n) -> new ReportSummaryResponse.IncidentMetrics(
            rs.getObject("mttr_hours", Double.class),
            rs.getObject("mtta_hours", Double.class),
            rs.getLong("open_count"),
            rs.getLong("resolved_count"),
            rs.getLong("total_count")
        ), days);
    }

    private ReportSummaryResponse.SlaMetrics slaMetrics() {
        String sql = """
            SELECT
              COUNT(*)                                          AS total,
              COUNT(*) FILTER (WHERE status = 'breached')      AS breached,
              COUNT(*) FILTER (WHERE status = 'met')           AS met
            FROM sla_instances
            """;
        return jdbc.queryForObject(sql, (rs, n) -> {
            long total = rs.getLong("total");
            long breached = rs.getLong("breached");
            long met = rs.getLong("met");
            double rate = total > 0 ? (breached * 100.0 / total) : 0.0;
            return new ReportSummaryResponse.SlaMetrics(total, breached, met, rate);
        });
    }

    private List<ReportSummaryResponse.VolumeByDay> volumeByDay(int days) {
        String sql = """
            SELECT TO_CHAR(created_at::date, 'YYYY-MM-DD') AS day, COUNT(*) AS cnt
            FROM incidents
            WHERE created_at >= NOW() - (?::int || ' days')::INTERVAL
            GROUP BY day ORDER BY day
            """;
        return jdbc.query(sql, (rs, n) ->
            new ReportSummaryResponse.VolumeByDay(rs.getString("day"), rs.getLong("cnt")), days);
    }

    private List<ReportSummaryResponse.VolumeByPriority> volumeByPriority(int days) {
        String sql = """
            SELECT priority, COUNT(*) AS cnt
            FROM incidents
            WHERE created_at >= NOW() - (?::int || ' days')::INTERVAL
            GROUP BY priority ORDER BY cnt DESC
            """;
        return jdbc.query(sql, (rs, n) ->
            new ReportSummaryResponse.VolumeByPriority(rs.getString("priority"), rs.getLong("cnt")), days);
    }

    private List<ReportSummaryResponse.VolumeByStatus> volumeByStatus(int days) {
        String sql = """
            SELECT status, COUNT(*) AS cnt
            FROM incidents
            WHERE created_at >= NOW() - (?::int || ' days')::INTERVAL
            GROUP BY status ORDER BY cnt DESC
            """;
        return jdbc.query(sql, (rs, n) ->
            new ReportSummaryResponse.VolumeByStatus(rs.getString("status"), rs.getLong("cnt")), days);
    }

    // ---- ERP Financial Reporting ----

    public List<Map<String, Object>> getBudgetVariance(UUID tenantId) {
        String sql = """
            SELECT cc.id, cc.name, cc.budget_amount,
                   COALESCE(SUM(e.amount), 0) AS spent,
                   (cc.budget_amount - COALESCE(SUM(e.amount), 0)) AS variance,
                   ROUND((COALESCE(SUM(e.amount), 0) / NULLIF(cc.budget_amount, 0) * 100), 2) AS variance_pct
            FROM cost_centers cc
            LEFT JOIN expenses e ON e.cost_center_id = cc.id AND e.status IN ('APPROVED', 'PAID')
            WHERE cc.tenant_id = ? AND cc.deleted_at IS NULL
            GROUP BY cc.id, cc.name, cc.budget_amount
            ORDER BY variance_pct DESC
            """;
        return jdbc.queryForList(sql, tenantId);
    }

    public List<Map<String, Object>> getExpenseBreakdown(UUID tenantId, String period) {
        String sql = """
            SELECT category, COUNT(*) AS count, SUM(amount) AS total_amount
            FROM expenses
            WHERE tenant_id = ? AND deleted_at IS NULL
              AND DATE_TRUNC('month', expense_date) = ?::date
            GROUP BY category ORDER BY total_amount DESC
            """;
        return jdbc.queryForList(sql, tenantId, period);
    }

    public List<Map<String, Object>> getInvoiceAging(UUID tenantId) {
        String sql = """
            SELECT
              CASE
                WHEN due_date >= CURRENT_DATE THEN '0-30'
                WHEN due_date >= CURRENT_DATE - INTERVAL '30 days' THEN '31-60'
                WHEN due_date >= CURRENT_DATE - INTERVAL '60 days' THEN '61-90'
                ELSE '90+'
              END AS aging_bucket,
              COUNT(*) AS count,
              SUM(total_amount) AS total_amount
            FROM invoices
            WHERE tenant_id = ? AND status NOT IN ('PAID', 'CANCELLED') AND deleted_at IS NULL
            GROUP BY aging_bucket
            """;
        return jdbc.queryForList(sql, tenantId);
    }

    public List<Map<String, Object>> getPOAging(UUID tenantId) {
        String sql = """
            SELECT
              status,
              CASE
                WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN '0-30 days'
                WHEN created_at >= CURRENT_DATE - INTERVAL '60 days' THEN '31-60 days'
                ELSE '60+ days'
              END AS age_bucket,
              COUNT(*) AS count
            FROM purchase_orders
            WHERE tenant_id = ? AND deleted_at IS NULL
            GROUP BY status, age_bucket
            ORDER BY status, age_bucket
            """;
        return jdbc.queryForList(sql, tenantId);
    }

    public List<Map<String, Object>> getVendorSpend(UUID tenantId) {
        String sql = """
            SELECT v.id, v.name,
                   SUM(po.total_amount) AS ytd_spend,
                   COUNT(po.id) AS po_count,
                   AVG(po.total_amount) AS avg_po_amount
            FROM vendors v
            LEFT JOIN purchase_orders po ON po.vendor_id = v.id
              AND EXTRACT(YEAR FROM po.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
            WHERE v.tenant_id = ? AND v.deleted_at IS NULL
            GROUP BY v.id, v.name
            ORDER BY ytd_spend DESC NULLS LAST
            LIMIT 20
            """;
        return jdbc.queryForList(sql, tenantId);
    }

    public List<Map<String, Object>> getInventoryValuation(UUID tenantId) {
        String sql = """
            SELECT warehouse_id, COUNT(*) AS item_count,
                   SUM(quantity * unit_cost) AS total_value
            FROM inventory_items
            WHERE tenant_id = ? AND deleted_at IS NULL
            GROUP BY warehouse_id
            ORDER BY total_value DESC
            """;
        return jdbc.queryForList(sql, tenantId);
    }

    public List<Map<String, Object>> getStockMovements(UUID tenantId, String period) {
        String sql = """
            SELECT
              DATE_TRUNC('day', movement_date)::date AS movement_day,
              COUNT(*) AS movements,
              SUM(CASE WHEN movement_type = 'IN' THEN quantity ELSE 0 END) AS inbound,
              SUM(CASE WHEN movement_type = 'OUT' THEN quantity ELSE 0 END) AS outbound
            FROM inventory_movements
            WHERE tenant_id = ? AND deleted_at IS NULL
              AND movement_date >= ?::date
            GROUP BY movement_day
            ORDER BY movement_day DESC
            """;
        return jdbc.queryForList(sql, tenantId, period);
    }

    public List<Map<String, Object>> getWorkforceCapacityUtilization(UUID tenantId) {
        String sql = """
            SELECT team_id, team_name,
                   SUM(allocated_hours) AS allocated_hours,
                   SUM(available_hours) AS available_hours,
                   ROUND((SUM(allocated_hours) / NULLIF(SUM(available_hours), 0) * 100), 2) AS utilization_pct
            FROM (
              SELECT cp.team_id, 'Team' AS team_name,
                     cp.allocated_hours, (cp.available_hours - cp.allocated_hours) AS available_hours
              FROM capacity_plans cp
              WHERE cp.tenant_id = ? AND cp.plan_date = CURRENT_DATE
            ) subq
            GROUP BY team_id, team_name
            ORDER BY utilization_pct DESC
            """;
        return jdbc.queryForList(sql, tenantId);
    }

    public List<Map<String, Object>> getVendorPerformanceSummary(UUID tenantId) {
        String sql = """
            SELECT v.id, v.name,
                   ROUND(AVG(vp.quality_rating), 2) AS avg_quality,
                   ROUND(AVG(vp.delivery_rating), 2) AS avg_delivery,
                   COUNT(DISTINCT vp.period) AS periods_tracked,
                   ROUND((COUNT(*) FILTER (WHERE vp.quality_rating >= 4) * 100 / NULLIF(COUNT(*), 0)), 2) AS compliance_pct
            FROM vendors v
            LEFT JOIN vendor_performance vp ON vp.vendor_id = v.id
            WHERE v.tenant_id = ? AND v.deleted_at IS NULL
            GROUP BY v.id, v.name
            ORDER BY avg_quality DESC NULLS LAST
            LIMIT 20
            """;
        return jdbc.queryForList(sql, tenantId);
    }

    public List<Map<String, Object>> getBillingChargeback(UUID tenantId) {
        String sql = """
            SELECT cc.id, cc.name, SUM(br.amount) AS total_charged
            FROM cost_centers cc
            LEFT JOIN billing_records br ON br.cost_center_id = cc.id
            WHERE cc.tenant_id = ? AND cc.deleted_at IS NULL AND br.deleted_at IS NULL
            GROUP BY cc.id, cc.name
            ORDER BY total_charged DESC NULLS LAST
            """;
        return jdbc.queryForList(sql, tenantId);
    }
}
