package com.orionops.modules.finance.service;

import com.orionops.common.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeneralLedgerService {

    // In-memory GL structure (production would use JPA entities)
    private final Map<String, Map<String, Object>> chartOfAccounts = new HashMap<>();
    private final Map<String, BigDecimal> accountBalances = new HashMap<>();

    public GeneralLedgerService() {
        // Initialize standard chart of accounts
        initializeChartOfAccounts();
    }

    private void initializeChartOfAccounts() {
        // Asset accounts (1000-1999)
        addAccount("1010", "Cash", "ASSET");
        addAccount("1200", "Accounts Receivable", "ASSET");
        addAccount("1500", "Inventory", "ASSET");
        addAccount("1600", "Fixed Assets", "ASSET");

        // Liability accounts (2000-2999)
        addAccount("2100", "Accounts Payable", "LIABILITY");
        addAccount("2200", "Accrued Expenses", "LIABILITY");
        addAccount("2500", "Long-term Debt", "LIABILITY");

        // Equity accounts (3000-3999)
        addAccount("3100", "Common Stock", "EQUITY");
        addAccount("3200", "Retained Earnings", "EQUITY");

        // Revenue accounts (4000-4999)
        addAccount("4100", "Service Revenue", "REVENUE");
        addAccount("4200", "Product Sales", "REVENUE");

        // Expense accounts (5000-5999)
        addAccount("5100", "Cost of Goods Sold", "EXPENSE");
        addAccount("5200", "Salaries & Wages", "EXPENSE");
        addAccount("5300", "Rent Expense", "EXPENSE");
        addAccount("5400", "Utilities", "EXPENSE");
        addAccount("6300", "Depreciation Expense", "EXPENSE");
    }

    private void addAccount(String code, String name, String type) {
        Map<String, Object> account = new HashMap<>();
        account.put("code", code);
        account.put("name", name);
        account.put("type", type);
        chartOfAccounts.put(code, account);
        accountBalances.put(code, BigDecimal.ZERO);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getChartOfAccounts(UUID tenantId) {
        return chartOfAccounts.values().stream().toList();
    }

    @Transactional(readOnly = true)
    public String suggestGLAccountForExpense(UUID expenseId) {
        // ML-based suggestion (placeholder - would use category matching)
        return "5200"; // Default to salaries & wages
    }

    @Transactional
    public void postToGLAccount(UUID tenantId, BigDecimal amount, String glAccountCode, String reference, LocalDate date) {
        if (!chartOfAccounts.containsKey(glAccountCode)) {
            throw new RuntimeException("GL account not found: " + glAccountCode);
        }

        BigDecimal current = accountBalances.getOrDefault(glAccountCode, BigDecimal.ZERO);
        accountBalances.put(glAccountCode, current.add(amount));

        log.info("GL Entry: {} {} to account {} ({})", amount, reference, glAccountCode, date);
    }

    @Transactional(readOnly = true)
    public BigDecimal getAccountBalance(String glAccountCode, LocalDate asOfDate) {
        return accountBalances.getOrDefault(glAccountCode, BigDecimal.ZERO);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getTrialBalance(UUID tenantId, LocalDate asOfDate) {
        Map<String, Object> trialBalance = new HashMap<>();
        BigDecimal totalDebits = BigDecimal.ZERO;
        BigDecimal totalCredits = BigDecimal.ZERO;

        for (Map.Entry<String, BigDecimal> entry : accountBalances.entrySet()) {
            String accountCode = entry.getKey();
            BigDecimal balance = entry.getValue();
            String accountType = (String) chartOfAccounts.get(accountCode).get("type");

            if (balance.compareTo(BigDecimal.ZERO) > 0) {
                if ("ASSET".equals(accountType) || "EXPENSE".equals(accountType)) {
                    totalDebits = totalDebits.add(balance);
                } else {
                    totalCredits = totalCredits.add(balance);
                }
            }
        }

        trialBalance.put("accounts", accountBalances);
        trialBalance.put("totalDebits", totalDebits);
        trialBalance.put("totalCredits", totalCredits);
        trialBalance.put("balanced", totalDebits.compareTo(totalCredits) == 0);

        return trialBalance;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> generateIncomeStatement(UUID tenantId, LocalDate startDate, LocalDate endDate) {
        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalExpenses = BigDecimal.ZERO;

        for (Map.Entry<String, BigDecimal> entry : accountBalances.entrySet()) {
            String accountCode = entry.getKey();
            BigDecimal balance = entry.getValue();
            String accountType = (String) chartOfAccounts.get(accountCode).get("type");

            if ("REVENUE".equals(accountType)) {
                totalRevenue = totalRevenue.add(balance);
            } else if ("EXPENSE".equals(accountType)) {
                totalExpenses = totalExpenses.add(balance);
            }
        }

        BigDecimal netIncome = totalRevenue.subtract(totalExpenses);

        return Map.of(
            "period", startDate + " to " + endDate,
            "totalRevenue", totalRevenue,
            "totalExpenses", totalExpenses,
            "grossProfit", totalRevenue.subtract(accountBalances.getOrDefault("5100", BigDecimal.ZERO)),
            "netIncome", netIncome
        );
    }
}
