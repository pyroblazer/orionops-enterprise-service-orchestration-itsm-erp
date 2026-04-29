package com.orionops.modules.procurement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class ProcurementResponse {

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class PRResponse {
        private UUID id; private String title; private String description;
        private BigDecimal estimatedCost; private UUID requestedBy; private UUID approvedBy;
        private UUID vendorId; private String status;
        private LocalDateTime submittedAt; private LocalDateTime approvedAt;
        private LocalDateTime createdAt;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class POResponse {
        private UUID id; private String poNumber; private UUID purchaseRequestId;
        private UUID vendorId; private BigDecimal totalAmount; private String status;
        private LocalDateTime orderDate; private LocalDateTime deliveryDate;
        private LocalDateTime createdAt;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class VendorResponse {
        private UUID id; private String name; private String description;
        private String contactEmail; private String contactPhone; private String address;
        private String website; private boolean active; private LocalDateTime createdAt;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ContractResponse {
        private UUID id; private String title; private String description;
        private UUID vendorId; private BigDecimal value; private LocalDateTime startDate;
        private LocalDateTime endDate; private String status; private LocalDateTime createdAt;
    }
}
