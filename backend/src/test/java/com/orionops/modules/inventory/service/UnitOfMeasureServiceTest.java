package com.orionops.modules.inventory.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for {@link UnitOfMeasureService}.
 * Tests real conversion computation, hierarchy, and compatibility logic.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UnitOfMeasureService")
class UnitOfMeasureServiceTest {

    @InjectMocks
    private UnitOfMeasureService uomService;

    @Nested
    @DisplayName("convertQuantity")
    class ConvertQuantityTests {

        @Test
        @DisplayName("should convert kg to lb")
        void shouldConvert_kgToLb() {
            BigDecimal result = uomService.convertQuantity(BigDecimal.TEN, "kg", "lb");
            assertThat(result).isEqualByComparingTo("22.0462");
        }

        @Test
        @DisplayName("should convert lb to kg")
        void shouldConvert_lbToKg() {
            BigDecimal result = uomService.convertQuantity(BigDecimal.TEN, "lb", "kg");
            assertThat(result).isEqualByComparingTo("4.53592");
        }

        @Test
        @DisplayName("should convert m to ft")
        void shouldConvert_mToFt() {
            BigDecimal result = uomService.convertQuantity(BigDecimal.TEN, "m", "ft");
            assertThat(result).isEqualByComparingTo("32.8084");
        }

        @Test
        @DisplayName("should convert l to gal")
        void shouldConvert_lToGal() {
            BigDecimal result = uomService.convertQuantity(BigDecimal.TEN, "l", "gal");
            assertThat(result).isEqualByComparingTo("2.64172");
        }

        @Test
        @DisplayName("should return input quantity for unknown conversion")
        void shouldReturnInput_forUnknownConversion() {
            BigDecimal qty = BigDecimal.valueOf(42);
            BigDecimal result = uomService.convertQuantity(qty, "xyz", "abc");
            assertThat(result).isEqualByComparingTo(qty);
        }

        @Test
        @DisplayName("should handle case-insensitive UOM codes")
        void shouldHandle_caseInsensitive() {
            BigDecimal lower = uomService.convertQuantity(BigDecimal.TEN, "kg", "lb");
            BigDecimal upper = uomService.convertQuantity(BigDecimal.TEN, "KG", "LB");
            assertThat(lower).isEqualByComparingTo(upper);
        }
    }

    @Nested
    @DisplayName("getUOMHierarchy")
    class GetUOMHierarchyTests {

        @Test
        @DisplayName("should return 4 groups")
        void shouldReturn4Groups() {
            Map<String, List<String>> hierarchy = uomService.getUOMHierarchy();

            assertThat(hierarchy).containsKeys("WEIGHT", "LENGTH", "VOLUME", "QUANTITY");
            assertThat(hierarchy).hasSize(4);
        }

        @Test
        @DisplayName("should contain kg in WEIGHT group")
        void shouldContain_kgInWeight() {
            Map<String, List<String>> hierarchy = uomService.getUOMHierarchy();

            assertThat(hierarchy.get("WEIGHT")).contains("kg", "lb");
        }
    }

    @Nested
    @DisplayName("validateUOMCompatibility")
    class ValidateUOMCompatibilityTests {

        @Test
        @DisplayName("should return true for same group UOMs")
        void shouldReturnTrue_sameGroup() {
            assertThat(uomService.validateUOMCompatibility("kg", "lb")).isTrue();
        }

        @Test
        @DisplayName("should return false for different group UOMs")
        void shouldReturnFalse_differentGroup() {
            assertThat(uomService.validateUOMCompatibility("kg", "m")).isFalse();
        }

        @Test
        @DisplayName("should return false for unknown UOM")
        void shouldReturnFalse_unknownUOM() {
            assertThat(uomService.validateUOMCompatibility("xyz", "kg")).isFalse();
        }
    }
}
