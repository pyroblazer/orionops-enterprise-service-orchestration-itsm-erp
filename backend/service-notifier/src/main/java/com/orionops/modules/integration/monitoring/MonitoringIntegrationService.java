package com.orionops.modules.integration.monitoring;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@ConditionalOnProperty(name = "orionops.monitoring.enabled", havingValue = "true")
@RequiredArgsConstructor
public class MonitoringIntegrationService {

    private final ObjectMapper objectMapper;

    @EventListener(ApplicationReadyEvent.class)
    public void loadAlertMapping() {
        log.info("Monitoring integration service initialized");
    }

    public void processMonitoringAlert(String alertPayload) {
        log.info("Processing monitoring alert: {}", alertPayload);
    }
}
