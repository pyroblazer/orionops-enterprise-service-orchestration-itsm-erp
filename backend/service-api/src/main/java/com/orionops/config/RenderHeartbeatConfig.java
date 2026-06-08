package com.orionops.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.Scheduled;

/**
 * Self-ping heartbeat to prevent Render free tier from spinning down
 * after 15 minutes of inactivity.
 *
 * <p>Only active when {@code orionops.render.heartbeat.enabled=true}.
 * Uses the built-in {@link java.net.http.HttpClient} to ping the
 * actuator health endpoint every 14 minutes.</p>
 */
@Slf4j
@Configuration
@ConditionalOnProperty(name = "orionops.render.heartbeat.enabled", havingValue = "true")
public class RenderHeartbeatConfig {

    @Value("${orionops.render.heartbeat.url:}")
    private String heartbeatUrl;

    /**
     * Self-pings the actuator health endpoint to keep the service warm.
     * Render free tier spins down after 15 min; this fires every 14 min.
     */
    @Scheduled(fixedDelayString = "${orionops.render.heartbeat.interval:840000}")
    public void selfPing() {
        if (heartbeatUrl == null || heartbeatUrl.isBlank()) {
            return;
        }
        try {
            java.net.http.HttpClient client = java.net.http.HttpClient.newBuilder()
                    .connectTimeout(java.time.Duration.ofSeconds(5))
                    .build();
            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create(heartbeatUrl))
                    .timeout(java.time.Duration.ofSeconds(10))
                    .GET()
                    .build();
            var response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
            log.debug("Render heartbeat: {} - status {}", heartbeatUrl, response.statusCode());
        } catch (Exception e) {
            log.warn("Render heartbeat failed: {}", e.getMessage());
        }
    }
}
