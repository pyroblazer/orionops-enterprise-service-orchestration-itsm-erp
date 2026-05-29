package com.orionops.modules.auth.service;

import com.orionops.common.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SegregationOfDutiesService {

    // Define conflicting activities (cannot be performed by same user)
    private static final Map<String, Set<String>> CONFLICTING_ACTIVITIES = new HashMap<>();

    static {
        // User cannot both create and approve expenses > $1000
        CONFLICTING_ACTIVITIES.put("create_expense", Set.of("approve_expense"));

        // User cannot be both PO creator and approver
        CONFLICTING_ACTIVITIES.put("create_po", Set.of("approve_po"));

        // User cannot both invoice and approve payment
        CONFLICTING_ACTIVITIES.put("create_invoice", Set.of("approve_payment"));

        // User cannot both record goods receipt and create invoice for it
        CONFLICTING_ACTIVITIES.put("record_goods_receipt", Set.of("create_invoice"));

        // Finance user cannot approve their own payment
        CONFLICTING_ACTIVITIES.put("request_payment", Set.of("approve_payment"));
    }

    @Transactional(readOnly = true)
    public boolean validateSoDCompliance(UUID userId, String activity) {
        // Check if user is trying to perform an activity that conflicts with their role
        Set<String> conflictingActivities = CONFLICTING_ACTIVITIES.getOrDefault(activity, new HashSet<>());

        for (String conflicting : conflictingActivities) {
            if (hasUserPerformedActivity(userId, conflicting)) {
                log.warn("SoD violation detected: User {} attempted {} but has already performed {}",
                    userId, activity, conflicting);
                return false;
            }
        }
        return true;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> checkExistingConflict(UUID userId, String activity) {
        Set<String> conflictingActivities = CONFLICTING_ACTIVITIES.getOrDefault(activity, new HashSet<>());

        for (String conflicting : conflictingActivities) {
            if (hasUserPerformedActivity(userId, conflicting)) {
                return Map.of(
                    "hasConflict", true,
                    "conflictingActivity", conflicting,
                    "requiresExemption", true
                );
            }
        }
        return Map.of("hasConflict", false);
    }

    @Transactional(readOnly = true)
    public String findAlternativeApprover(String activity) {
        // Find another user who can approve (ideally someone without conflicting activities)
        // This is a placeholder - real implementation would query user roles
        return "manager-role";
    }

    private boolean hasUserPerformedActivity(UUID userId, String activity) {
        // This would query an activity log table
        // For now, return false (can be enhanced with actual audit log queries)
        return false;
    }

    public static Map<String, List<String>> getSoDRules() {
        Map<String, List<String>> rules = new HashMap<>();
        for (Map.Entry<String, Set<String>> entry : CONFLICTING_ACTIVITIES.entrySet()) {
            rules.put(entry.getKey(), List.copyOf(entry.getValue()));
        }
        return rules;
    }
}
