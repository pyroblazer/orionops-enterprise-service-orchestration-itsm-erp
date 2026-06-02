package com.orionops.modules.inventory.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;

/**
 * Unit tests for {@link DepreciationService}.
 * No mocks needed — service returns fixed values and logs.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("DepreciationService")
class DepreciationServiceTest {

    @InjectMocks
    private DepreciationService depreciationService;

    @Nested
    @DisplayName("createDepreciationSchedule")
    class CreateDepreciationScheduleTests {

        @Test
        @DisplayName("should return STRAIGHT_LINE depreciation method")
        void shouldReturn_straightLineMethod() {
            Map<String, Object> schedule = depreciationService.createDepreciationSchedule(UUID.randomUUID());

            assertThat(schedule).containsEntry("depreciationMethod", "STRAIGHT_LINE");
        }

        @Test
        @DisplayName("should return 5-year useful life")
        void shouldReturn_5YearLife() {
            Map<String, Object> schedule = depreciationService.createDepreciationSchedule(UUID.randomUUID());

            assertThat(schedule).containsEntry("usefulLifeYears", 5);
        }

        @Test
        @DisplayName("should return zero salvage value")
        void shouldReturn_zeroSalvage() {
            Map<String, Object> schedule = depreciationService.createDepreciationSchedule(UUID.randomUUID());

            assertThat(schedule).containsEntry("salvageValue", BigDecimal.ZERO);
        }

        @Test
        @DisplayName("should include the correct assetId")
        void shouldInclude_assetId() {
            UUID assetId = UUID.randomUUID();

            Map<String, Object> schedule = depreciationService.createDepreciationSchedule(assetId);

            assertThat(schedule).containsEntry("assetId", assetId);
        }
    }

    @Nested
    @DisplayName("getDepreciationExpense")
    class GetDepreciationExpenseTests {

        @Test
        @DisplayName("should return non-negative value")
        void shouldReturnNonNegative() {
            BigDecimal expense = depreciationService.getDepreciationExpense(UUID.randomUUID(), YearMonth.now());

            assertThat(expense).isNotNull();
            assertThat(expense).isGreaterThanOrEqualTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("getBookValue")
    class GetBookValueTests {

        @Test
        @DisplayName("should return non-negative value")
        void shouldReturnNonNegative() {
            BigDecimal bookValue = depreciationService.getBookValue(UUID.randomUUID(), LocalDate.now());

            assertThat(bookValue).isNotNull();
            assertThat(bookValue).isGreaterThanOrEqualTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("recordAssetDisposal")
    class RecordAssetDisposalTests {

        @Test
        @DisplayName("should execute without error")
        void shouldExecute_withoutError() {
            assertThatNoException().isThrownBy(() ->
                    depreciationService.recordAssetDisposal(UUID.randomUUID(), LocalDate.now(), BigDecimal.TEN));
        }
    }
}
