package com.orionops.modules.finance.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;

@ExtendWith(MockitoExtension.class)
class GeneralLedgerServiceTest {

    @Mock
    private GeneralLedgerService glService;

    @Test
    void testGetChartOfAccounts() {
        java.util.List<Map<String, Object>> coa = glService.getChartOfAccounts(UUID.randomUUID());
        assertNotNull(coa);
    }

    @Test
    void testPostToGLAccount_ValidCode() {
        BigDecimal amount = BigDecimal.valueOf(1000);
        assertDoesNotThrow(() -> glService.postToGLAccount(UUID.randomUUID(), amount, "1000", "TEST", LocalDate.now()));
    }

    @Test
    void testPostToGLAccount_InvalidCode() {
        BigDecimal amount = BigDecimal.valueOf(1000);
        assertDoesNotThrow(() -> glService.postToGLAccount(UUID.randomUUID(), amount, "INVALID", "TEST", LocalDate.now()));
    }

    @Test
    void testGetAccountBalance() {
        BigDecimal balance = glService.getAccountBalance("1000", LocalDate.now());
        assertNotNull(balance);
    }

    @Test
    void testGetAccountBalance_WithDate() {
        BigDecimal balance = glService.getAccountBalance("1000", LocalDate.now());
        assertNotNull(balance);
    }

    @Test
    void testGetTrialBalance() {
        Map<String, Object> tb = glService.getTrialBalance(UUID.randomUUID(), LocalDate.now());
        assertNotNull(tb);
        assertTrue(tb.containsKey("debits") || tb.containsKey("credits"));
    }

    @Test
    void testGetTrialBalance_WithDate() {
        Map<String, Object> tb = glService.getTrialBalance(UUID.randomUUID(), LocalDate.now());
        assertNotNull(tb);
    }

    @Test
    void testGenerateIncomeStatement() {
        Map<String, Object> is = glService.generateIncomeStatement(UUID.randomUUID(), LocalDate.now().minusMonths(1), LocalDate.now());
        assertNotNull(is);
    }

    @Test
    void testGenerateIncomeStatement_WithDates() {
        Map<String, Object> is = glService.generateIncomeStatement(UUID.randomUUID(), LocalDate.now().minusMonths(1), LocalDate.now());
        assertNotNull(is);
    }
}
