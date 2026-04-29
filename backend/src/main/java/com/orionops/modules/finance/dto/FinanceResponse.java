package com.orionops.modules.finance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class FinanceResponse {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BudgetResponse {
        private UUID id;
        private String name;
        private String description;
        private BigDecimal totalAmount;
        private BigDecimal spentAmount;
        private BigDecimal committedAmount;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        private String fiscalYear;
        private UUID costCenterId;
        private BigDecimal utilizationPercentage;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CostCenterResponse {
        private UUID id;
        private String name;
        private String code;
        private String description;
        private String owner;
        private boolean active;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExpenseResponse {
        private UUID id;
        private String description;
        private BigDecimal amount;
        private UUID budgetId;
        private UUID costCenterId;
        private String category;
        private LocalDateTime expenseDate;
        private UUID submittedBy;
        private String status;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InvoiceResponse {
        private UUID id;
        private String invoiceNumber;
        private UUID vendorId;
        private BigDecimal amount;
        private BigDecimal taxAmount;
        private LocalDateTime invoiceDate;
        private LocalDateTime dueDate;
        private LocalDateTime paidDate;
        private String status;
        private String description;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentResponse {
        private UUID id;
        private UUID invoiceId;
        private BigDecimal amount;
        private LocalDateTime paymentDate;
        private String method;
        private String reference;
        private String notes;
        private LocalDateTime createdAt;
    }
}
