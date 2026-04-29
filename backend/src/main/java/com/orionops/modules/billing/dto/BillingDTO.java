package com.orionops.modules.billing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class BillingDTO {

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UsageRequest {
        private UUID serviceId; private UUID tenantEntityId; private String usageType;
        @Positive private BigDecimal quantity; private BigDecimal unitCost; private String description;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UsageResponse {
        private UUID id; private UUID serviceId; private UUID tenantEntityId;
        private String usageType; private BigDecimal quantity; private BigDecimal unitCost;
        private BigDecimal totalCost; private LocalDateTime usageDate; private String description; private LocalDateTime createdAt;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class GenerateInvoiceRequest {
        private LocalDateTime periodStart; private LocalDateTime periodEnd;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class BillingRecordResponse {
        private UUID id; private String invoiceNumber; private BigDecimal amount;
        private BigDecimal taxAmount; private LocalDateTime periodStart; private LocalDateTime periodEnd;
        private String status; private LocalDateTime generatedAt; private LocalDateTime paidAt; private LocalDateTime createdAt;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CostModelRequest {
        @NotBlank private String name; private String description; private UUID serviceId;
        private String pricingType; private BigDecimal fixedPrice; private BigDecimal unitPrice;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CostModelResponse {
        private UUID id; private String name; private String description; private UUID serviceId;
        private String pricingType; private BigDecimal fixedPrice; private BigDecimal unitPrice;
        private boolean active; private LocalDateTime createdAt;
    }
}
