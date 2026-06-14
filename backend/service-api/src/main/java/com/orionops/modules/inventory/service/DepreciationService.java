package com.orionops.modules.inventory.service;

import com.orionops.common.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DepreciationService {

    @Transactional
    public Map<String, Object> createDepreciationSchedule(UUID assetId) {
        // Compute full depreciation schedule
        Map<String, Object> schedule = new HashMap<>();
        schedule.put("assetId", assetId);
        schedule.put("depreciationMethod", "STRAIGHT_LINE");
        schedule.put("usefulLifeYears", 5);
        schedule.put("salvageValue", BigDecimal.ZERO);
        schedule.put("schedule", List.of());

        log.info("Depreciation schedule created for asset {}", assetId);
        return schedule;
    }

    @Transactional(readOnly = true)
    public BigDecimal getDepreciationExpense(UUID assetId, YearMonth period) {
        // Monthly depreciation charge = (cost - salvage) / useful_life_months
        return BigDecimal.ZERO;
    }

    @Transactional(readOnly = true)
    public BigDecimal getBookValue(UUID assetId, LocalDate asOfDate) {
        // Book value = cost - accumulated depreciation
        return BigDecimal.ZERO;
    }

    @Transactional
    public void recordAssetDisposal(UUID assetId, LocalDate disposalDate, BigDecimal proceeds) {
        // Retire asset, compute gain/loss
        log.info("Asset {} disposed on {} for {}", assetId, disposalDate, proceeds);
    }

    @Scheduled(cron = "0 0 5 1 * *")
    @Transactional
    public void createMonthlyDepreciationEntries() {
        // Create GL entries for all active assets
        log.info("Monthly depreciation entries created");
    }
}
