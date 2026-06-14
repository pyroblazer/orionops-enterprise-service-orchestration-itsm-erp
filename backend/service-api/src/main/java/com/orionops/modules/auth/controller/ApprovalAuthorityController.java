package com.orionops.modules.auth.controller;

import com.orionops.modules.auth.service.ApprovalAuthorityService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/compliance/approval-authorities")
@RequiredArgsConstructor
@Tag(name = "Approval Authorities", description = "User approval authority limits")
public class ApprovalAuthorityController {

    private final ApprovalAuthorityService authorityService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<Void> setApprovalAuthority(@RequestBody Map<String, Object> body) {
        UUID userId = UUID.fromString((String) body.get("userId"));
        String activityType = (String) body.get("activityType");
        BigDecimal maxAmount = new BigDecimal(body.get("maxAmount").toString());
        authorityService.setApprovalAuthority(userId, activityType, maxAmount);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/can-approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'COMPLIANCE_VIEWER')")
    public ResponseEntity<Boolean> canUserApprove(@RequestBody Map<String, Object> body) {
        UUID userId = UUID.fromString((String) body.get("userId"));
        String activityType = (String) body.get("activityType");
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        boolean canApprove = authorityService.canUserApprove(userId, activityType, amount);
        return ResponseEntity.ok(canApprove);
    }

    @GetMapping("/suggest")
    @PreAuthorize("hasAnyRole('ADMIN', 'COMPLIANCE_VIEWER')")
    public ResponseEntity<UUID> getSuggestedApprover(
            @RequestParam(required = false) String activityType,
            @RequestParam(required = false) BigDecimal amount) {
        UUID approver = authorityService.getSuggestedApprover(activityType, amount);
        return ResponseEntity.ok(approver);
    }
}
