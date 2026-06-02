package com.orionops.modules.finance.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for {@link GeneralLedgerService}.
 * Covers chart of accounts, GL posting, trial balance, and income statement.
 * GeneralLedgerService is in-memory — no mocks needed.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("GeneralLedgerService")
class GeneralLedgerServiceTest {

    @InjectMocks
    private GeneralLedgerService glService;

    private UUID tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
    }

    @Nested
    @DisplayName("getChartOfAccounts")
    class GetChartOfAccountsTests {

        @Test
        @DisplayName("should return 16 accounts")
        void shouldReturn16Accounts() {
            List<Map<String, Object>> coa = glService.getChartOfAccounts(tenantId);

            assertThat(coa).hasSize(16);
        }

        @Test
        @DisplayName("should contain all account categories")
        void shouldContain_allCategories() {
            List<Map<String, Object>> coa = glService.getChartOfAccounts(tenantId);

            List<String> types = coa.stream().map(a -> (String) a.get("type")).distinct().toList();
            assertThat(types).containsExactlyInAnyOrder("ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE");
        }

        @Test
        @DisplayName("should include Cash account 1010")
        void shouldInclude_cashAccount() {
            List<Map<String, Object>> coa = glService.getChartOfAccounts(tenantId);

            assertThat(coa.stream().anyMatch(a -> "1010".equals(a.get("code")) && "Cash".equals(a.get("name")))).isTrue();
        }
    }

    @Nested
    @DisplayName("postToGLAccount")
    class PostToGLAccountTests {

        @Test
        @DisplayName("should add amount to account balance")
        void shouldAddToBalance() {
            glService.postToGLAccount(tenantId, BigDecimal.valueOf(1000), "1010", "Test posting", LocalDate.now());

            BigDecimal balance = glService.getAccountBalance("1010", LocalDate.now());
            assertThat(balance).isEqualByComparingTo(BigDecimal.valueOf(1000));
        }

        @Test
        @DisplayName("should accumulate multiple posts")
        void shouldAccumulate_multiplePosts() {
            glService.postToGLAccount(tenantId, BigDecimal.valueOf(500), "1010", "Post 1", LocalDate.now());
            glService.postToGLAccount(tenantId, BigDecimal.valueOf(300), "1010", "Post 2", LocalDate.now());

            BigDecimal balance = glService.getAccountBalance("1010", LocalDate.now());
            assertThat(balance).isEqualByComparingTo(BigDecimal.valueOf(800));
        }

        @Test
        @DisplayName("should throw for invalid account code")
        void shouldThrow_forInvalidCode() {
            assertThatThrownBy(() ->
                    glService.postToGLAccount(tenantId, BigDecimal.valueOf(100), "9999", "Test", LocalDate.now()))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("GL account not found");
        }
    }

    @Nested
    @DisplayName("getAccountBalance")
    class GetAccountBalanceTests {

        @Test
        @DisplayName("should return zero for new account")
        void shouldReturnZero_forNewAccount() {
            BigDecimal balance = glService.getAccountBalance("1010", LocalDate.now());
            assertThat(balance).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("should return posted balance")
        void shouldReturnPostedBalance() {
            glService.postToGLAccount(tenantId, BigDecimal.valueOf(2500), "1200", "AR entry", LocalDate.now());

            BigDecimal balance = glService.getAccountBalance("1200", LocalDate.now());
            assertThat(balance).isEqualByComparingTo(BigDecimal.valueOf(2500));
        }
    }

    @Nested
    @DisplayName("getTrialBalance")
    class GetTrialBalanceTests {

        @Test
        @DisplayName("should categorize debits and credits correctly")
        void shouldCategorize_debitsAndCredits() {
            // ASSET (1010 Cash) → debit side
            glService.postToGLAccount(tenantId, BigDecimal.valueOf(5000), "1010", "Cash in", LocalDate.now());
            // LIABILITY (2100 AP) → credit side
            glService.postToGLAccount(tenantId, BigDecimal.valueOf(3000), "2100", "AP entry", LocalDate.now());

            Map<String, Object> tb = glService.getTrialBalance(tenantId, LocalDate.now());

            assertThat((BigDecimal) tb.get("totalDebits")).isEqualByComparingTo(BigDecimal.valueOf(5000));
            assertThat((BigDecimal) tb.get("totalCredits")).isEqualByComparingTo(BigDecimal.valueOf(3000));
        }

        @Test
        @DisplayName("should report balanced when debits equal credits")
        void shouldReportBalanced_whenEqual() {
            glService.postToGLAccount(tenantId, BigDecimal.valueOf(1000), "1010", "Debit", LocalDate.now());
            glService.postToGLAccount(tenantId, BigDecimal.valueOf(1000), "2100", "Credit", LocalDate.now());

            Map<String, Object> tb = glService.getTrialBalance(tenantId, LocalDate.now());

            assertThat(tb).containsEntry("balanced", true);
        }

        @Test
        @DisplayName("should report unbalanced when debits differ from credits")
        void shouldReportUnbalanced_whenUnequal() {
            glService.postToGLAccount(tenantId, BigDecimal.valueOf(1000), "1010", "Debit", LocalDate.now());
            glService.postToGLAccount(tenantId, BigDecimal.valueOf(500), "2100", "Credit", LocalDate.now());

            Map<String, Object> tb = glService.getTrialBalance(tenantId, LocalDate.now());

            assertThat(tb).containsEntry("balanced", false);
        }

        @Test
        @DisplayName("should be balanced with no postings")
        void shouldReportBalanced_whenNoPostings() {
            Map<String, Object> tb = glService.getTrialBalance(tenantId, LocalDate.now());

            assertThat(tb).containsEntry("balanced", true);
            assertThat((BigDecimal) tb.get("totalDebits")).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat((BigDecimal) tb.get("totalCredits")).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("generateIncomeStatement")
    class GenerateIncomeStatementTests {

        @Test
        @DisplayName("should calculate net income as revenue minus expenses")
        void shouldCalculate_netIncome() {
            // Post revenue
            glService.postToGLAccount(tenantId, BigDecimal.valueOf(10000), "4100", "Revenue", LocalDate.now());
            // Post expenses
            glService.postToGLAccount(tenantId, BigDecimal.valueOf(3000), "5200", "Salaries", LocalDate.now());

            Map<String, Object> is = glService.generateIncomeStatement(tenantId, LocalDate.now().minusMonths(1), LocalDate.now());

            assertThat((BigDecimal) is.get("totalRevenue")).isEqualByComparingTo(BigDecimal.valueOf(10000));
            assertThat((BigDecimal) is.get("totalExpenses")).isEqualByComparingTo(BigDecimal.valueOf(3000));
            assertThat((BigDecimal) is.get("netIncome")).isEqualByComparingTo(BigDecimal.valueOf(7000));
        }

        @Test
        @DisplayName("should calculate gross profit as revenue minus COGS")
        void shouldCalculate_grossProfit() {
            glService.postToGLAccount(tenantId, BigDecimal.valueOf(20000), "4100", "Revenue", LocalDate.now());
            glService.postToGLAccount(tenantId, BigDecimal.valueOf(8000), "5100", "COGS", LocalDate.now());

            Map<String, Object> is = glService.generateIncomeStatement(tenantId, LocalDate.now().minusMonths(1), LocalDate.now());

            // grossProfit = revenue - COGS = 20000 - 8000 = 12000
            assertThat((BigDecimal) is.get("grossProfit")).isEqualByComparingTo(BigDecimal.valueOf(12000));
        }

        @Test
        @DisplayName("should return all zeros when no postings")
        void shouldHandleAllZero() {
            Map<String, Object> is = glService.generateIncomeStatement(tenantId, LocalDate.now().minusMonths(1), LocalDate.now());

            assertThat((BigDecimal) is.get("totalRevenue")).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat((BigDecimal) is.get("totalExpenses")).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat((BigDecimal) is.get("netIncome")).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat((BigDecimal) is.get("grossProfit")).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }
}
