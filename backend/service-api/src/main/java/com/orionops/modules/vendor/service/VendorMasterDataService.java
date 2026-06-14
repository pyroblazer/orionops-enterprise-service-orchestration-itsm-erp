package com.orionops.modules.vendor.service;

import com.orionops.common.tenant.TenantContextHolder;
import com.orionops.modules.vendor.entity.Vendor;
import com.orionops.modules.vendor.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VendorMasterDataService {

    private final VendorRepository.VendorEntityRepository vendorRepository;

    @Transactional(readOnly = true)
    public List<Map<String, Object>> suggestDuplicateVendors(UUID vendorId) {
        Vendor vendor = vendorRepository.findById(vendorId)
            .orElseThrow(() -> new RuntimeException("Vendor not found"));

        List<Vendor> allVendors = vendorRepository.findByTenantIdAndDeletedAtIsNull(
            TenantContextHolder.getCurrentTenantId()
        );

        return allVendors.stream()
            .filter(v -> !v.getId().equals(vendorId))
            .map(other -> Map.of(
                "vendorId", (Object) other.getId(),
                "vendorName", other.getName(),
                "similarity", calculateSimilarity(vendor.getName(), other.getName()),
                "sameLocation", vendor.getAddress() != null &&
                    vendor.getAddress().equals(other.getAddress())
            ))
            .filter(m -> (double) m.get("similarity") > 0.7 || (boolean) m.get("sameLocation"))
            .collect(Collectors.toList());
    }

    @Transactional
    public void consolidateVendors(UUID primaryVendorId, List<UUID> duplicateVendorIds) {
        Vendor primaryVendor = vendorRepository.findById(primaryVendorId)
            .orElseThrow(() -> new RuntimeException("Primary vendor not found"));

        for (UUID duplicateId : duplicateVendorIds) {
            Vendor duplicate = vendorRepository.findById(duplicateId)
                .orElseThrow(() -> new RuntimeException("Duplicate vendor not found"));

            // Mark duplicate as inactive
            duplicate.setActive(false);
            vendorRepository.save(duplicate);

            log.info("Consolidated vendor {} into {}", duplicateId, primaryVendorId);
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Object> calculateDataQualityScore(UUID vendorId) {
        Vendor vendor = vendorRepository.findById(vendorId)
            .orElseThrow(() -> new RuntimeException("Vendor not found"));

        int totalFields = 8;
        int filledFields = 0;

        if (vendor.getName() != null && !vendor.getName().isBlank()) filledFields++;
        if (vendor.getContactEmail() != null && !vendor.getContactEmail().isBlank()) filledFields++;
        if (vendor.getContactPhone() != null && !vendor.getContactPhone().isBlank()) filledFields++;
        if (vendor.getAddress() != null && !vendor.getAddress().isBlank()) filledFields++;
        if (vendor.getWebsite() != null && !vendor.getWebsite().isBlank()) filledFields++;
        if (vendor.getCategory() != null && !vendor.getCategory().isBlank()) filledFields++;
        if (vendor.getDescription() != null && !vendor.getDescription().isBlank()) filledFields++;

        int score = (filledFields * 100) / totalFields;

        return Map.of(
            "vendorId", vendorId,
            "vendorName", vendor.getName(),
            "qualityScore", score,
            "filledFields", filledFields,
            "totalFields", totalFields,
            "missingFields", totalFields - filledFields
        );
    }

    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void flagInactiveVendors() {
        UUID tenantId = TenantContextHolder.getCurrentTenantId();
        LocalDate oneYearAgo = LocalDate.now().minusYears(1);

        List<Vendor> inactiveVendors = vendorRepository.findByTenantIdAndDeletedAtIsNull(tenantId)
            .stream()
            .filter(v -> v.isActive() && shouldBeInactive(v, oneYearAgo))
            .collect(Collectors.toList());

        for (Vendor vendor : inactiveVendors) {
            vendor.setActive(false);
            vendorRepository.save(vendor);
            log.info("Flagged vendor {} as inactive", vendor.getId());
        }
    }

    @Transactional
    public void auditVendorChange(UUID vendorId, String fieldName, Object oldValue, Object newValue, UUID changedBy) {
        Vendor vendor = vendorRepository.findById(vendorId)
            .orElseThrow(() -> new RuntimeException("Vendor not found"));

        log.info("Vendor {} audit: {} changed from {} to {} by {}",
            vendorId, fieldName, oldValue, newValue, changedBy);

        // In production, this would write to an audit_events table
    }

    private double calculateSimilarity(String name1, String name2) {
        if (name1 == null || name2 == null) return 0.0;

        String n1 = name1.toLowerCase().replaceAll("[^a-z0-9]", "");
        String n2 = name2.toLowerCase().replaceAll("[^a-z0-9]", "");

        if (n1.equals(n2)) return 1.0;
        if (n1.contains(n2) || n2.contains(n1)) return 0.8;

        // Simple Levenshtein-based similarity
        return 1.0 - ((double) levenshteinDistance(n1, n2) / Math.max(n1.length(), n2.length()));
    }

    private int levenshteinDistance(String s1, String s2) {
        int len1 = s1.length();
        int len2 = s2.length();
        int[][] dp = new int[len1 + 1][len2 + 1];

        for (int i = 0; i <= len1; i++) dp[i][0] = i;
        for (int j = 0; j <= len2; j++) dp[0][j] = j;

        for (int i = 1; i <= len1; i++) {
            for (int j = 1; j <= len2; j++) {
                dp[i][j] = Math.min(Math.min(
                    dp[i - 1][j] + 1,
                    dp[i][j - 1] + 1),
                    dp[i - 1][j - 1] + (s1.charAt(i - 1) == s2.charAt(j - 1) ? 0 : 1)
                );
            }
        }
        return dp[len1][len2];
    }

    private boolean shouldBeInactive(Vendor vendor, LocalDate cutoffDate) {
        // Check if vendor has any recent purchase orders
        // This is a placeholder - actual implementation would query PO table
        return true;
    }
}
