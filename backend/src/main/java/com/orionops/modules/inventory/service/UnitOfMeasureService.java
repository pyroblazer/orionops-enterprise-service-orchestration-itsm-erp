package com.orionops.modules.inventory.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class UnitOfMeasureService {

    private static final Map<String, BigDecimal> conversions = new HashMap<>();

    static {
        // Weight conversions
        conversions.put("kg_to_lb", BigDecimal.valueOf(2.20462));
        conversions.put("lb_to_kg", BigDecimal.valueOf(0.453592));
        conversions.put("g_to_oz", BigDecimal.valueOf(0.035274));

        // Length conversions
        conversions.put("m_to_ft", BigDecimal.valueOf(3.28084));
        conversions.put("ft_to_m", BigDecimal.valueOf(0.3048));
        conversions.put("km_to_mi", BigDecimal.valueOf(0.621371));

        // Volume conversions
        conversions.put("l_to_gal", BigDecimal.valueOf(0.264172));
        conversions.put("gal_to_l", BigDecimal.valueOf(3.78541));
    }

    public BigDecimal convertQuantity(BigDecimal quantity, String fromUOM, String toUOM) {
        String conversionKey = fromUOM.toLowerCase() + "_to_" + toUOM.toLowerCase();
        BigDecimal factor = conversions.get(conversionKey);

        if (factor == null) {
            log.warn("No conversion found from {} to {}", fromUOM, toUOM);
            return quantity;
        }

        return quantity.multiply(factor);
    }

    public Map<String, List<String>> getUOMHierarchy() {
        return Map.of(
            "WEIGHT", List.of("kg", "lb", "g", "oz", "ton"),
            "LENGTH", List.of("m", "ft", "km", "mi", "cm", "in"),
            "VOLUME", List.of("l", "gal", "ml", "fl_oz", "pt"),
            "QUANTITY", List.of("pc", "dz", "box", "case")
        );
    }

    public boolean validateUOMCompatibility(String baseUOM, String altUOM) {
        Map<String, List<String>> hierarchy = getUOMHierarchy();
        for (List<String> group : hierarchy.values()) {
            if (group.contains(baseUOM) && group.contains(altUOM)) {
                return true;
            }
        }
        return false;
    }
}
