package com.orionops.modules.tenant.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

public class TenantDTO {

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CreateTenantRequest {
        @NotBlank private String name; @NotBlank private String slug;
        private String description; @NotBlank private String domain;
        private String logoUrl; private String primaryContactEmail; private UUID planId;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TenantResponse {
        private UUID id; private String name; private String slug;
        private String description; private String domain; private String logoUrl;
        private String primaryContactEmail; private String status;
        private String stripeCustomerId; private LocalDateTime createdAt;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SubscriptionResponse {
        private UUID id; private UUID tenantEntityId; private UUID planId;
        private String planName; private String status; private LocalDateTime startDate;
        private LocalDateTime endDate; private LocalDateTime trialEnd; private LocalDateTime createdAt;
    }
}
