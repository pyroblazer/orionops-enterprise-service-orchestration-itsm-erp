package com.orionops.modules.finance.controller;

import com.orionops.common.tenant.TenantContextHolder;
import com.orionops.modules.finance.service.GeneralLedgerService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/finance/gl")
@RequiredArgsConstructor
@Tag(name = "General Ledger", description = "Chart of accounts and GL operations")
public class GeneralLedgerController {

    private final GeneralLedgerService glService;

    @GetMapping("/accounts")
    @PreAuthorize("hasAnyRole('FINANCE_VIEWER', 'FINANCE_MANAGER', 'ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getChartOfAccounts() {
        List<Map<String, Object>> accounts = glService.getChartOfAccounts(TenantContextHolder.getCurrentTenantId());
        return ResponseEntity.ok(accounts);
    }

    @GetMapping("/trial-balance")
    @PreAuthorize("hasAnyRole('FINANCE_VIEWER', 'FINANCE_MANAGER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getTrialBalance(
            @RequestParam(required = false) String asOfDate) {
        Map<String, Object> trialBalance = glService.getTrialBalance(TenantContextHolder.getCurrentTenantId(), asOfDate);
        return ResponseEntity.ok(trialBalance);
    }

    @GetMapping("/income-statement")
    @PreAuthorize("hasAnyRole('FINANCE_VIEWER', 'FINANCE_MANAGER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getIncomeStatement(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        Map<String, Object> statement = glService.generateIncomeStatement(TenantContextHolder.getCurrentTenantId(), startDate, endDate);
        return ResponseEntity.ok(statement);
    }

    @PostMapping("/post")
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER', 'ADMIN')")
    public ResponseEntity<Void> postGLEntry(@RequestBody Map<String, Object> body) {
        String glAccountCode = (String) body.get("glAccountCode");
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        String reference = (String) body.get("reference");
        String date = (String) body.get("date");

        glService.postToGLAccount(glAccountCode, amount, reference, date);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/accounts/{code}/balance")
    @PreAuthorize("hasAnyRole('FINANCE_VIEWER', 'FINANCE_MANAGER', 'ADMIN')")
    public ResponseEntity<BigDecimal> getAccountBalance(
            @PathVariable String code,
            @RequestParam(required = false) String asOfDate) {
        BigDecimal balance = glService.getAccountBalance(code, asOfDate);
        return ResponseEntity.ok(balance);
    }
}
