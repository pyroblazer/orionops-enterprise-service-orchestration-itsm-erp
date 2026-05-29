package com.orionops.modules.finance.controller;

import com.orionops.common.tenant.TenantContextHolder;
import com.orionops.modules.finance.service.FinanceForecastService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/finance/forecast")
@RequiredArgsConstructor
@Tag(name = "Finance Forecast", description = "Budget forecasting and alerts")
public class FinanceForecastController {

    private final FinanceForecastService forecastService;

    @GetMapping("/budgets/{id}")
    @PreAuthorize("hasAnyRole('FINANCE_VIEWER', 'FINANCE_MANAGER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getBudgetForecast(@PathVariable UUID id) {
        Map<String, Object> forecast = forecastService.forecastBudgetUsage(id);
        return ResponseEntity.ok(forecast);
    }

    @GetMapping("/alerts")
    @PreAuthorize("hasAnyRole('FINANCE_VIEWER', 'FINANCE_MANAGER', 'ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getBudgetAlerts() {
        List<Map<String, Object>> alerts = forecastService.getBudgetAlerts(TenantContextHolder.getCurrentTenantId());
        return ResponseEntity.ok(alerts);
    }
}
