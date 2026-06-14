package com.orionops.modules.finance.entity;

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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "expenses")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Expense extends BaseEntity {

    @Column(nullable = false)
    private String description;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column
    private UUID budgetId;

    @Column
    private UUID costCenterId;

    @Enumerated(EnumType.STRING)
    private ExpenseCategory category;

    @Column
    private LocalDateTime expenseDate;

    @Column
    private UUID submittedBy;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ExpenseStatus status = ExpenseStatus.PENDING;

    public enum ExpenseCategory {
        OPERATIONAL, CAPITAL, MAINTENANCE, LICENSING, CONSULTING, OTHER
    }

    public enum ExpenseStatus {
        PENDING, APPROVED, REJECTED, PAID
    }
}
