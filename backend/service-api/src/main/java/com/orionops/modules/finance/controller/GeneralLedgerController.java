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
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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
        LocalDate date = asOfDate != null ? LocalDate.parse(asOfDate) : LocalDate.now();
        Map<String, Object> trialBalance = glService.getTrialBalance(TenantContextHolder.getCurrentTenantId(), date);
        return ResponseEntity.ok(trialBalance);
    }

    @GetMapping("/income-statement")
    @PreAuthorize("hasAnyRole('FINANCE_VIEWER', 'FINANCE_MANAGER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getIncomeStatement(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        LocalDate start = startDate != null ? LocalDate.parse(startDate) : LocalDate.now().minusMonths(1);
        LocalDate end = endDate != null ? LocalDate.parse(endDate) : LocalDate.now();
        Map<String, Object> statement = glService.generateIncomeStatement(TenantContextHolder.getCurrentTenantId(), start, end);
        return ResponseEntity.ok(statement);
    }

    @PostMapping("/post")
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER', 'ADMIN')")
    public ResponseEntity<Void> postGLEntry(@RequestBody Map<String, Object> body) {
        String glAccountCode = (String) body.get("glAccountCode");
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        String reference = (String) body.get("reference");
        String dateStr = (String) body.get("date");
        LocalDate date = dateStr != null ? LocalDate.parse(dateStr) : LocalDate.now();

        glService.postToGLAccount(TenantContextHolder.getCurrentTenantId(), amount, glAccountCode, reference, date);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/accounts/{code}/balance")
    @PreAuthorize("hasAnyRole('FINANCE_VIEWER', 'FINANCE_MANAGER', 'ADMIN')")
    public ResponseEntity<BigDecimal> getAccountBalance(
            @PathVariable String code,
            @RequestParam(required = false) String asOfDate) {
        LocalDate date = asOfDate != null ? LocalDate.parse(asOfDate) : LocalDate.now();
        BigDecimal balance = glService.getAccountBalance(code, date);
        return ResponseEntity.ok(balance);
    }
}
