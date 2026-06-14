package com.orionops.modules.finance.repository;

import com.orionops.modules.finance.entity.Budget;
import com.orionops.modules.finance.entity.CostCenter;
import com.orionops.modules.finance.entity.Expense;
import com.orionops.modules.finance.entity.Invoice;
import com.orionops.modules.finance.entity.PaymentRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

public class FinanceRepository {

    @Repository
    public interface BudgetRepository extends JpaRepository<Budget, UUID> {
        List<Budget> findByTenantIdAndDeletedAtIsNull(UUID tenantId);
    }

    @Repository
    public interface CostCenterRepository extends JpaRepository<CostCenter, UUID> {
        List<CostCenter> findByTenantIdAndDeletedAtIsNull(UUID tenantId);
    }

    @Repository
    public interface ExpenseRepository extends JpaRepository<Expense, UUID> {
        List<Expense> findByTenantIdAndDeletedAtIsNull(UUID tenantId);
        List<Expense> findByBudgetIdAndDeletedAtIsNull(UUID budgetId);
    }

    @Repository
    public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
        List<Invoice> findByTenantIdAndDeletedAtIsNull(UUID tenantId);
    }

    @Repository
    public interface PaymentRecordRepository extends JpaRepository<PaymentRecord, UUID> {
        List<PaymentRecord> findByTenantIdAndDeletedAtIsNull(UUID tenantId);
        List<PaymentRecord> findByInvoiceIdAndDeletedAtIsNull(UUID invoiceId);
    }
}
