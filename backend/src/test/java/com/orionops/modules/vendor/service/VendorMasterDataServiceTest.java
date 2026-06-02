package com.orionops.modules.vendor.service;

import com.orionops.modules.vendor.entity.Vendor;
import com.orionops.modules.vendor.repository.VendorRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link VendorMasterDataService}.
 * Covers duplicate detection (Levenshtein), data quality scoring, and consolidation.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("VendorMasterDataService")
class VendorMasterDataServiceTest {

    @Mock
    private VendorRepository.VendorEntityRepository vendorRepository;

    @InjectMocks
    private VendorMasterDataService mdmService;

    @Nested
    @DisplayName("suggestDuplicateVendors")
    class SuggestDuplicateVendorsTests {

        @Test
        @DisplayName("should find duplicates by name similarity > 0.7")
        void shouldFind_bySimilarity() {
            Vendor source = Vendor.builder().name("Acme Corporation").address("123 Main").active(true).build();
            source.setId(UUID.randomUUID());

            Vendor similar = Vendor.builder().name("Acme Corporatoin").address("456 Oak").active(true).build();
            similar.setId(UUID.randomUUID());

            when(vendorRepository.findById(source.getId())).thenReturn(Optional.of(source));
            when(vendorRepository.findByTenantIdAndDeletedAtIsNull(any(UUID.class)))
                    .thenReturn(List.of(source, similar));

            List<Map<String, Object>> duplicates = mdmService.suggestDuplicateVendors(source.getId());

            assertThat(duplicates).isNotEmpty();
            assertThat(duplicates.stream().anyMatch(d -> d.get("vendorId").equals(similar.getId()))).isTrue();
        }

        @Test
        @DisplayName("should find duplicates by same address")
        void shouldFind_bySameAddress() {
            Vendor source = Vendor.builder().name("Alpha Inc").address("100 Main St").active(true).build();
            source.setId(UUID.randomUUID());

            Vendor sameAddr = Vendor.builder().name("Beta LLC").address("100 Main St").active(true).build();
            sameAddr.setId(UUID.randomUUID());

            when(vendorRepository.findById(source.getId())).thenReturn(Optional.of(source));
            when(vendorRepository.findByTenantIdAndDeletedAtIsNull(any(UUID.class)))
                    .thenReturn(List.of(source, sameAddr));

            List<Map<String, Object>> duplicates = mdmService.suggestDuplicateVendors(source.getId());

            assertThat(duplicates.stream().anyMatch(d -> (boolean) d.get("sameLocation"))).isTrue();
        }

        @Test
        @DisplayName("should exclude self from results")
        void shouldExclude_self() {
            Vendor source = Vendor.builder().name("Test").address("Addr").active(true).build();
            source.setId(UUID.randomUUID());

            when(vendorRepository.findById(source.getId())).thenReturn(Optional.of(source));
            when(vendorRepository.findByTenantIdAndDeletedAtIsNull(any(UUID.class)))
                    .thenReturn(List.of(source));

            List<Map<String, Object>> duplicates = mdmService.suggestDuplicateVendors(source.getId());

            assertThat(duplicates).isEmpty();
        }

        @Test
        @DisplayName("should not match vendors with low similarity and different address")
        void shouldNotMatch_lowSimilarity() {
            Vendor source = Vendor.builder().name("Alpha").address("Street A").active(true).build();
            source.setId(UUID.randomUUID());

            Vendor different = Vendor.builder().name("Completely Different Name LLC").address("Street B").active(true).build();
            different.setId(UUID.randomUUID());

            when(vendorRepository.findById(source.getId())).thenReturn(Optional.of(source));
            when(vendorRepository.findByTenantIdAndDeletedAtIsNull(any(UUID.class)))
                    .thenReturn(List.of(source, different));

            List<Map<String, Object>> duplicates = mdmService.suggestDuplicateVendors(source.getId());

            assertThat(duplicates).isEmpty();
        }

        @Test
        @DisplayName("should throw when vendor not found")
        void shouldThrow_whenVendorNotFound() {
            UUID id = UUID.randomUUID();
            when(vendorRepository.findById(id)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> mdmService.suggestDuplicateVendors(id))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Vendor not found");
        }
    }

    @Nested
    @DisplayName("calculateDataQualityScore")
    class CalculateDataQualityScoreTests {

        @Test
        @DisplayName("should score 87 when all checked fields filled (7 of 8)")
        void shouldScore87_whenAllFieldsFilled() {
            Vendor vendor = Vendor.builder()
                    .name("Acme").contactEmail("a@b.com").contactPhone("+1")
                    .address("123 St").website("acme.com").category("IT")
                    .description("Desc").build();
            vendor.setId(UUID.randomUUID());

            when(vendorRepository.findById(vendor.getId())).thenReturn(Optional.of(vendor));

            Map<String, Object> result = mdmService.calculateDataQualityScore(vendor.getId());

            // Service checks 7 fields out of 8 total → 7*100/8 = 87
            assertThat(result).containsEntry("qualityScore", 87);
            assertThat(result).containsEntry("filledFields", 7);
            assertThat(result).containsEntry("totalFields", 8);
        }

        @Test
        @DisplayName("should score proportionally when some fields filled")
        void shouldScore50_when4FieldsFilled() {
            Vendor vendor = Vendor.builder()
                    .name("Acme").contactEmail("a@b.com").contactPhone("+1")
                    .address("123 St").build();
            vendor.setId(UUID.randomUUID());

            when(vendorRepository.findById(vendor.getId())).thenReturn(Optional.of(vendor));

            Map<String, Object> result = mdmService.calculateDataQualityScore(vendor.getId());

            assertThat(result).containsEntry("filledFields", 4);
            assertThat(result).containsEntry("qualityScore", 50); // 4*100/8 = 50
        }

        @Test
        @DisplayName("should score 0 when all fields are blank")
        void shouldScore0_whenAllFieldsBlank() {
            Vendor vendor = Vendor.builder()
                    .name("").contactEmail("").contactPhone("")
                    .address("").website("").category("")
                    .description("").build();
            vendor.setId(UUID.randomUUID());

            when(vendorRepository.findById(vendor.getId())).thenReturn(Optional.of(vendor));

            Map<String, Object> result = mdmService.calculateDataQualityScore(vendor.getId());

            assertThat(result).containsEntry("qualityScore", 0);
            assertThat(result).containsEntry("filledFields", 0);
        }

        @Test
        @DisplayName("should throw when vendor not found")
        void shouldThrow_whenVendorNotFound() {
            UUID id = UUID.randomUUID();
            when(vendorRepository.findById(id)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> mdmService.calculateDataQualityScore(id))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Vendor not found");
        }
    }

    @Nested
    @DisplayName("consolidateVendors")
    class ConsolidateVendorsTests {

        @Test
        @DisplayName("should deactivate duplicate vendors")
        void shouldDeactivate_duplicates() {
            UUID primaryId = UUID.randomUUID();
            UUID dup1Id = UUID.randomUUID();

            Vendor primary = Vendor.builder().name("Primary").active(true).build();
            primary.setId(primaryId);
            Vendor dup1 = Vendor.builder().name("Duplicate").active(true).build();
            dup1.setId(dup1Id);

            when(vendorRepository.findById(primaryId)).thenReturn(Optional.of(primary));
            when(vendorRepository.findById(dup1Id)).thenReturn(Optional.of(dup1));

            mdmService.consolidateVendors(primaryId, List.of(dup1Id));

            ArgumentCaptor<Vendor> captor = ArgumentCaptor.forClass(Vendor.class);
            verify(vendorRepository).save(captor.capture());
            assertThat(captor.getValue().isActive()).isFalse();
        }

        @Test
        @DisplayName("should save all duplicate vendors")
        void shouldSave_allDuplicates() {
            UUID primaryId = UUID.randomUUID();
            UUID dup1 = UUID.randomUUID();
            UUID dup2 = UUID.randomUUID();

            Vendor primary = Vendor.builder().name("Primary").active(true).build();
            primary.setId(primaryId);
            Vendor d1 = Vendor.builder().name("Dup1").active(true).build();
            d1.setId(dup1);
            Vendor d2 = Vendor.builder().name("Dup2").active(true).build();
            d2.setId(dup2);

            when(vendorRepository.findById(primaryId)).thenReturn(Optional.of(primary));
            when(vendorRepository.findById(dup1)).thenReturn(Optional.of(d1));
            when(vendorRepository.findById(dup2)).thenReturn(Optional.of(d2));

            mdmService.consolidateVendors(primaryId, List.of(dup1, dup2));

            verify(vendorRepository, times(2)).save(any(Vendor.class));
        }

        @Test
        @DisplayName("should throw when primary vendor not found")
        void shouldThrow_whenPrimaryNotFound() {
            UUID primaryId = UUID.randomUUID();
            when(vendorRepository.findById(primaryId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> mdmService.consolidateVendors(primaryId, List.of()))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Primary vendor not found");
        }
    }

    @Nested
    @DisplayName("auditVendorChange")
    class AuditVendorChangeTests {

        @Test
        @DisplayName("should execute without error")
        void shouldExecute_withoutError() {
            UUID vendorId = UUID.randomUUID();
            Vendor vendor = Vendor.builder().name("Test").active(true).build();
            vendor.setId(vendorId);

            when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(vendor));

            mdmService.auditVendorChange(vendorId, "name", "Old Name", "New Name", UUID.randomUUID());
            // No exception = pass
        }
    }
}
