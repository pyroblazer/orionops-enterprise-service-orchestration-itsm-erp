package com.orionops.modules.inventory.controller;

import com.orionops.modules.inventory.service.UnitOfMeasureService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.preauthorize.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/inventory/uom")
@RequiredArgsConstructor
@Tag(name = "Unit of Measure", description = "Unit conversions and management")
public class UnitOfMeasureController {

    private final UnitOfMeasureService uomService;

    @GetMapping
    @PreAuthorize("hasAnyRole('INVENTORY_VIEWER', 'ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getUOMHierarchy() {
        List<Map<String, Object>> hierarchy = uomService.getUOMHierarchy();
        return ResponseEntity.ok(hierarchy);
    }

    @PostMapping("/convert")
    @PreAuthorize("hasAnyRole('INVENTORY_VIEWER', 'ADMIN')")
    public ResponseEntity<BigDecimal> convertUOM(@RequestBody Map<String, Object> body) {
        BigDecimal quantity = new BigDecimal(body.get("quantity").toString());
        String fromUOM = (String) body.get("fromUOM");
        String toUOM = (String) body.get("toUOM");

        BigDecimal converted = uomService.convertQuantity(quantity, fromUOM, toUOM);
        return ResponseEntity.ok(converted);
    }

    @GetMapping("/compatible")
    @PreAuthorize("hasAnyRole('INVENTORY_VIEWER', 'ADMIN')")
    public ResponseEntity<Boolean> validateUOMCompatibility(
            @RequestParam(required = false) String baseUOM,
            @RequestParam(required = false) String altUOM) {
        boolean compatible = uomService.validateUOMCompatibility(baseUOM, altUOM);
        return ResponseEntity.ok(compatible);
    }
}
