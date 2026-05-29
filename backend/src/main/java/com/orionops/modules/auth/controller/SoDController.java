package com.orionops.modules.auth.controller;

import com.orionops.modules.auth.service.SegregationOfDutiesService;
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
@RequestMapping("/api/v1/compliance/sod")
@RequiredArgsConstructor
@Tag(name = "Segregation of Duties", description = "SoD compliance validation")
public class SoDController {

    private final SegregationOfDutiesService sodService;

    @GetMapping("/rules")
    @PreAuthorize("hasAnyRole('COMPLIANCE_VIEWER', 'ADMIN')")
    public ResponseEntity<Map<String, List<String>>> getSoDRules() {
        Map<String, List<String>> rules = sodService.getSoDRules();
        return ResponseEntity.ok(rules);
    }

    @PostMapping("/validate")
    @PreAuthorize("hasAnyRole('COMPLIANCE_VIEWER', 'ADMIN')")
    public ResponseEntity<Boolean> validateSoDCompliance(@RequestBody Map<String, Object> body) {
        UUID userId = UUID.fromString((String) body.get("userId"));
        String activity = (String) body.get("activity");
        boolean compliant = sodService.validateSoDCompliance(userId, activity);
        return ResponseEntity.ok(compliant);
    }

    @GetMapping("/check")
    @PreAuthorize("hasAnyRole('COMPLIANCE_VIEWER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> checkSoDConflict(
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) String activity) {
        Map<String, Object> conflict = sodService.checkExistingConflict(userId, activity);
        return ResponseEntity.ok(conflict);
    }
}
