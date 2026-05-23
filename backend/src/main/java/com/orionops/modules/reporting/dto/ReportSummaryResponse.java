package com.orionops.modules.reporting.dto;

import java.util.List;

public record ReportSummaryResponse(
    IncidentMetrics incidentMetrics,
    SlaMetrics slaMetrics,
    List<VolumeByDay> volumeByDay,
    List<VolumeByPriority> volumeByPriority,
    List<VolumeByStatus> volumeByStatus
) {

    public record IncidentMetrics(
        Double mttrHours,
        Double mttaHours,
        Long openCount,
        Long resolvedCount,
        Long totalCount
    ) {}

    public record SlaMetrics(
        Long totalInstances,
        Long breachedCount,
        Long metCount,
        Double breachRatePercent
    ) {}

    public record VolumeByDay(String date, Long count) {}
    public record VolumeByPriority(String priority, Long count) {}
    public record VolumeByStatus(String status, Long count) {}
}
