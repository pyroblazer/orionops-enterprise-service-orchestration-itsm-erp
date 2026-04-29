package com.orionops.modules.procurement.dto;

import com.orionops.modules.procurement.entity.Contract;
import com.orionops.modules.procurement.entity.PurchaseOrder;
import com.orionops.modules.procurement.entity.PurchaseRequest;
import com.orionops.modules.procurement.entity.Vendor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class ProcurementRequest {

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class PRRequest {
        @NotBlank private String title;
        private String description;
        @Positive private BigDecimal estimatedCost;
        private UUID requestedBy;
        private UUID vendorId;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class PORequest {
        @NotBlank private String poNumber;
        private UUID purchaseRequestId;
        private UUID vendorId;
        @Positive private BigDecimal totalAmount;
        private LocalDateTime deliveryDate;
        private String terms;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class VendorRequest {
        @NotBlank private String name;
        private String description;
        private String contactEmail;
        private String contactPhone;
        private String address;
        private String website;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ContractRequest {
        @NotBlank private String title;
        private String description;
        private UUID vendorId;
        private BigDecimal value;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        private String terms;
    }
}
