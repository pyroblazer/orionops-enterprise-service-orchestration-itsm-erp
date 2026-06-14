package com.orionops.modules.integration.webhook;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository for webhook delivery log persistence and querying.
 */
@Repository
public interface WebhookDeliveryLogRepository extends JpaRepository<WebhookDeliveryLog, UUID> {

    /**
     * Finds all delivery logs for a specific webhook.
     */
    List<WebhookDeliveryLog> findByWebhookIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID webhookId);

    /**
     * Finds failed deliveries eligible for retry (not yet dead-lettered and under max retries).
     */
    @Query("SELECT wdl FROM WebhookDeliveryLog wdl WHERE wdl.status IN :statuses " +
            "AND wdl.retryCount < :maxRetries AND wdl.deletedAt IS NULL")
    List<WebhookDeliveryLog> findFailedDeliveriesForRetry(
            List<WebhookDeliveryLog.DeliveryStatus> statuses, int maxRetries);

    /**
     * Finds dead-lettered deliveries for administrative review.
     */
    List<WebhookDeliveryLog> findByStatusAndDeletedAtIsNull(WebhookDeliveryLog.DeliveryStatus status);

    /**
     * Counts successful deliveries for a webhook within a time range.
     */
    long countByWebhookIdAndStatusAndDeliveredAtBetweenAndDeletedAtIsNull(
            UUID webhookId, WebhookDeliveryLog.DeliveryStatus status,
            LocalDateTime from, LocalDateTime to);

    /**
     * Finds recent delivery logs for a specific event type.
     */
    List<WebhookDeliveryLog> findByEventTypeAndDeletedAtIsNullOrderByCreatedAtDesc(String eventType);
}
