package com.orionops.modules.reporting.service;

import com.orionops.modules.reporting.dto.ReportSummaryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

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
}
