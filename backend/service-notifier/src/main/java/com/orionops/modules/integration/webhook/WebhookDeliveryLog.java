package com.orionops.modules.integration.webhook;

import com.orionops.common.auditing.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity tracking webhook delivery attempts for observability and debugging.
 *
 * <p>Each record captures the full request/response cycle of a webhook delivery,
 * including retry attempts. Failed deliveries that exceed the maximum retry count
 * are marked as DEAD_LETTER for manual inspection.</p>
 */
@Entity
@Table(name = "webhook_delivery_logs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebhookDeliveryLog extends BaseEntity {

    @Column(nullable = false)
    private UUID webhookId;

    @Column(nullable = false)
    private String eventType;

    @Column(columnDefinition = "TEXT")
    private String payload;

    @Column
    private Integer responseCode;

    @Column(columnDefinition = "TEXT")
    private String responseBody;

    @Column
    private LocalDateTime deliveredAt;

    @Builder.Default
    @Column(nullable = false)
    private Integer retryCount = 0;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false)
    private DeliveryStatus status = DeliveryStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    @Column
    private String signature;

    @Column
    private Integer latencyMs;

    /**
     * Delivery status enumeration tracking the lifecycle of a webhook delivery.
     */
    public enum DeliveryStatus {
        PENDING,
        DELIVERED,
        FAILED,
        DEAD_LETTER,
        RETRYING
    }
}
