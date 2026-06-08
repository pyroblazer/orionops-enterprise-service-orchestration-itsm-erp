package com.orionops.modules.vendor.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class VendorDTO {

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class VendorRequest {
        @NotBlank private String name; private String description; private String contactEmail;
        private String contactPhone; private String address; private String website; private String category;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class VendorResponse {
        private UUID id; private String name; private String description; private String contactEmail;
        private String contactPhone; private String address; private String website; private String category;
        private BigDecimal overallRating; private boolean active; private LocalDateTime createdAt;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class PerformanceRequest {
        private BigDecimal qualityScore; private BigDecimal deliveryScore;
        private BigDecimal responsivenessScore; private String evaluator; private String comments;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class PerformanceResponse {
        private UUID id; private UUID vendorId; private BigDecimal qualityScore;
        private BigDecimal deliveryScore; private BigDecimal responsivenessScore;
        private BigDecimal overallScore; private LocalDateTime evaluationDate;
        private String evaluator; private String comments; private LocalDateTime createdAt;
    }
}
