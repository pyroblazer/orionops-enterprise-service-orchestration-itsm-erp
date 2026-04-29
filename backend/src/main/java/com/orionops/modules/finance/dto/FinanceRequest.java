package com.orionops.modules.finance.dto;

import com.orionops.modules.finance.entity.Budget;
import com.orionops.modules.finance.entity.CostCenter;
import com.orionops.modules.finance.entity.Expense;
import com.orionops.modules.finance.entity.Invoice;
import com.orionops.modules.finance.entity.PaymentRecord;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class FinanceRequest {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BudgetRequest {
        @NotBlank(message = "Name is required")
        private String name;
        private String description;
        @Positive(message = "Total amount must be positive")
        private BigDecimal totalAmount;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        private String fiscalYear;
        private UUID costCenterId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CostCenterRequest {
        @NotBlank(message = "Name is required")
        private String name;
        private String code;
        private String description;
        private String owner;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExpenseRequest {
        @NotBlank(message = "Description is required")
        private String description;
        @Positive(message = "Amount must be positive")
        private BigDecimal amount;
        private UUID budgetId;
        private UUID costCenterId;
        private Expense.ExpenseCategory category;
        private LocalDateTime expenseDate;
        private UUID submittedBy;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InvoiceRequest {
        @NotBlank(message = "Invoice number is required")
        private String invoiceNumber;
        private UUID vendorId;
        @Positive(message = "Amount must be positive")
        private BigDecimal amount;
        private BigDecimal taxAmount;
        private LocalDateTime invoiceDate;
        private LocalDateTime dueDate;
        private String description;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentRequest {
        private UUID invoiceId;
        @Positive(message = "Amount must be positive")
        private BigDecimal amount;
        private LocalDateTime paymentDate;
        private PaymentRecord.PaymentMethod method;
        private String reference;
        private String notes;
    }
}
