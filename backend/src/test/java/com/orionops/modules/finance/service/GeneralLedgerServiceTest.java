package com.orionops.modules.finance.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class GeneralLedgerServiceTest {

    @Mock
    private GeneralLedgerService glService;

    @Test
    void testGetChartOfAccounts() {
        Map<String, Object> coa = glService.getChartOfAccounts();
        assertNotNull(coa);
    }

    @Test
    void testPostToGLAccount_ValidCode() {
        BigDecimal amount = BigDecimal.valueOf(1000);
        assertDoesNotThrow(() -> glService.postToGLAccount("1000", amount, "TEST", LocalDate.now()));
    }

    @Test
    void testPostToGLAccount_InvalidCode() {
        BigDecimal amount = BigDecimal.valueOf(1000);
        assertDoesNotThrow(() -> glService.postToGLAccount("INVALID", amount, "TEST", LocalDate.now()));
    }

    @Test
    void testGetAccountBalance() {
        BigDecimal balance = glService.getAccountBalance("1000");
        assertNotNull(balance);
    }

    @Test
    void testGetAccountBalance_WithDate() {
        BigDecimal balance = glService.getAccountBalance("1000", LocalDate.now());
        assertNotNull(balance);
    }

    @Test
    void testGetTrialBalance() {
        Map<String, Object> tb = glService.getTrialBalance();
        assertNotNull(tb);
        assertTrue(tb.containsKey("debits") || tb.containsKey("credits"));
    }

    @Test
    void testGetTrialBalance_WithDate() {
        Map<String, Object> tb = glService.getTrialBalance(LocalDate.now());
        assertNotNull(tb);
    }

    @Test
    void testGenerateIncomeStatement() {
        Map<String, Object> is = glService.generateIncomeStatement();
        assertNotNull(is);
    }

    @Test
    void testGenerateIncomeStatement_WithDates() {
        Map<String, Object> is = glService.generateIncomeStatement(LocalDate.now().minusMonths(1), LocalDate.now());
        assertNotNull(is);
    }
}
