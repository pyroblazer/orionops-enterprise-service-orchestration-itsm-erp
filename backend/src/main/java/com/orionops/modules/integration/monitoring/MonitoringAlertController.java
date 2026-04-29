package com.orionops.modules.integration.monitoring;

import com.orionops.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST controller for receiving monitoring system webhook alerts.
 *
 * <p>Provides a single webhook endpoint that accepts alert payloads from
 * Prometheus Alertmanager, Datadog, New Relic, and generic monitoring tools.
 * The payload format is auto-detected and parsed accordingly.</p>
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/integrations/monitoring")
@RequiredArgsConstructor
@Tag(name = "Monitoring Integration", description = "Monitoring system webhook endpoints")
public class MonitoringAlertController {

    private final MonitoringIntegrationService monitoringIntegrationService;

    /**
     * Receives monitoring alert webhooks and creates incidents.
     *
     * <p>Supports Alertmanager, Datadog, New Relic, and generic alert formats.
     * The source format is auto-detected from the payload structure.</p>
     *
     * @param alertPayload the raw alert payload from the monitoring system
     * @return the created incident response
     */
    @PostMapping("/alerts")
    @Operation(summary = "Receive monitoring alert webhook and create incident",
               description = "Accepts alert payloads from Prometheus Alertmanager, Datadog, "
                       + "New Relic, and generic monitoring systems")
    public ResponseEntity<ApiResponse<Object>> ingestAlert(
            @RequestBody Map<String, Object> alertPayload) {
        log.info("Received monitoring alert webhook: payload size={}", alertPayload.size());
        Object incidentResponse = monitoringIntegrationService.ingestAlert(alertPayload);
        return ResponseEntity.ok(ApiResponse.success(incidentResponse, "Alert processed and incident created"));
    }
}
