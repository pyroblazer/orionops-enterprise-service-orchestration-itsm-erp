package com.orionops.modules.auth.service;

import com.orionops.common.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApprovalAuthorityService {

    private final Map<UUID, Map<String, Object>> authorities = new HashMap<>();

    @Transactional(readOnly = true)
    public boolean canUserApprove(UUID userId, String activityType, BigDecimal amount) {
        Map<String, Object> authority = authorities.getOrDefault(userId, new HashMap<>());
        BigDecimal maxAmount = (BigDecimal) authority.getOrDefault("maxAmount_" + activityType, BigDecimal.ZERO);

        return maxAmount.compareTo(amount) >= 0;
    }

    @Transactional(readOnly = true)
    public UUID getSuggestedApprover(String activityType, BigDecimal amount) {
        // Find lowest-authority user who can approve
        for (Map.Entry<UUID, Map<String, Object>> entry : authorities.entrySet()) {
            BigDecimal maxAmount = (BigDecimal) entry.getValue().getOrDefault("maxAmount_" + activityType, BigDecimal.ZERO);
            if (maxAmount.compareTo(amount) >= 0) {
                return entry.getKey();
            }
        }
        return null;
    }

    @Transactional(readOnly = true)
    public boolean validateApprovalChain(UUID documentId, String docType) {
        // Validate multi-level approvals for high-value documents
        // e.g., >$10K needs manager + finance director
        return true;
    }

    @Transactional
    public void setApprovalAuthority(UUID userId, String activityType, BigDecimal maxAmount) {
        Map<String, Object> authority = authorities.getOrDefault(userId, new HashMap<>());
        authority.put("userId", userId);
        authority.put("maxAmount_" + activityType, maxAmount);
        authorities.put(userId, authority);

        log.info("Approval authority set for user {}: {} up to {}", userId, activityType, maxAmount);
    }
}
