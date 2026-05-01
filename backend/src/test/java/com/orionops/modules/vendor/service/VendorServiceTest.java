package com.orionops.modules.vendor.service;

import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.modules.vendor.dto.VendorDTO;
import com.orionops.modules.vendor.entity.Vendor;
import com.orionops.modules.vendor.entity.VendorPerformance;
import com.orionops.modules.vendor.repository.VendorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link VendorService}.
 * Covers Vendor CRUD, performance recording with weighted scoring, and performance retrieval.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("VendorService")
class VendorServiceTest {

    @Mock
    private VendorRepository.VendorEntityRepository vendorRepository;

    @Mock
    private VendorRepository.VendorPerformanceRepository performanceRepository;

    @InjectMocks
    private VendorService vendorService;

    private UUID tenantId;
    private Vendor testVendor;

    @BeforeEach
    void setUp() {
        tenantId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        testVendor = Vendor.builder()
                .name("Acme Corp")
                .description("IT hardware supplier")
                .contactEmail("sales@acme.com")
                .contactPhone("+1-555-0100")
                .category("Hardware")
                .active(true)
                .build();
        testVendor.setTenantId(tenantId);
        testVendor.setId(UUID.randomUUID());
        testVendor.setCreatedAt(LocalDateTime.now());
        testVendor.setUpdatedAt(LocalDateTime.now());
        testVendor.setCreatedBy("procurement");
    }

    @Nested
    @DisplayName("createVendor")
    class CreateVendorTests {

        @Test
        @DisplayName("should create vendor with valid fields")
        void shouldCreateVendor_whenValidRequest_givenAllFields() {
            VendorDTO.VendorRequest request = VendorDTO.VendorRequest.builder()
                    .name("TechSupply Inc")
                    .description("Software licensing vendor")
                    .contactEmail("info@techsupply.com")
                    .contactPhone("+1-555-0200")
                    .category("Software")
                    .build();

            when(vendorRepository.save(any(Vendor.class))).thenAnswer(invocation -> {
                Vendor v = invocation.getArgument(0);
                v.setId(UUID.randomUUID());
                v.setCreatedAt(LocalDateTime.now());
                v.setUpdatedAt(LocalDateTime.now());
                return v;
            });

            VendorDTO.VendorResponse response = vendorService.createVendor(request);

            assertThat(response).isNotNull();
            assertThat(response.getName()).isEqualTo("TechSupply Inc");
            assertThat(response.getContactEmail()).isEqualTo("info@techsupply.com");
        }
    }

    @Nested
    @DisplayName("getVendor")
    class GetVendorTests {

        @Test
        @DisplayName("should return vendor by ID")
        void shouldReturnVendor_whenFound_givenValidId() {
            when(vendorRepository.findById(testVendor.getId())).thenReturn(Optional.of(testVendor));

            VendorDTO.VendorResponse response = vendorService.getVendor(testVendor.getId());

            assertThat(response).isNotNull();
            assertThat(response.getName()).isEqualTo("Acme Corp");
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when not found")
        void shouldThrowNotFoundException_whenNotFound_givenInvalidId() {
            UUID randomId = UUID.randomUUID();
            when(vendorRepository.findById(randomId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> vendorService.getVendor(randomId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Vendor");
        }
    }

    @Nested
    @DisplayName("recordPerformance")
    class RecordPerformanceTests {

        @Test
        @DisplayName("should calculate weighted overall score")
        void shouldCalculateOverallScore_whenRecording_givenAllScores() {
            VendorDTO.PerformanceRequest request = VendorDTO.PerformanceRequest.builder()
                    .qualityScore(new BigDecimal("4.50"))
                    .deliveryScore(new BigDecimal("3.80"))
                    .responsivenessScore(new BigDecimal("4.20"))
                    .evaluator("procurement-manager")
                    .comments("Good overall performance")
                    .build();

            when(vendorRepository.findById(testVendor.getId())).thenReturn(Optional.of(testVendor));
            when(performanceRepository.save(any(VendorPerformance.class))).thenAnswer(invocation -> {
                VendorPerformance perf = invocation.getArgument(0);
                perf.setId(UUID.randomUUID());
                perf.setCreatedAt(LocalDateTime.now());
                return perf;
            });

            VendorDTO.PerformanceResponse response = vendorService.recordPerformance(testVendor.getId(), request);

            assertThat(response).isNotNull();
            // Average of 4.50, 3.80, 4.20 = 12.50 / 3 = 4.17
            BigDecimal expectedOverall = new BigDecimal("4.50")
                    .add(new BigDecimal("3.80"))
                    .add(new BigDecimal("4.20"))
                    .divide(BigDecimal.valueOf(3), 2, RoundingMode.HALF_UP);
            assertThat(response.getOverallScore()).isEqualByComparingTo(expectedOverall);
        }

        @Test
        @DisplayName("should handle null scores gracefully")
        void shouldHandleNullScores_whenRecording_givenPartialScores() {
            VendorDTO.PerformanceRequest request = VendorDTO.PerformanceRequest.builder()
                    .qualityScore(new BigDecimal("4.00"))
                    .deliveryScore(null)
                    .responsivenessScore(null)
                    .build();

            when(vendorRepository.findById(testVendor.getId())).thenReturn(Optional.of(testVendor));
            when(performanceRepository.save(any(VendorPerformance.class))).thenAnswer(invocation -> {
                VendorPerformance perf = invocation.getArgument(0);
                perf.setId(UUID.randomUUID());
                perf.setCreatedAt(LocalDateTime.now());
                return perf;
            });

            VendorDTO.PerformanceResponse response = vendorService.recordPerformance(testVendor.getId(), request);

            // Average of only quality score = 4.00
            assertThat(response.getOverallScore()).isEqualByComparingTo(new BigDecimal("4.00"));
        }

        @Test
        @DisplayName("should return zero when all scores are null")
        void shouldReturnZero_whenAllScoresNull_givenEmptyScores() {
            VendorDTO.PerformanceRequest request = VendorDTO.PerformanceRequest.builder()
                    .build();

            when(vendorRepository.findById(testVendor.getId())).thenReturn(Optional.of(testVendor));
            when(performanceRepository.save(any(VendorPerformance.class))).thenAnswer(invocation -> {
                VendorPerformance perf = invocation.getArgument(0);
                perf.setId(UUID.randomUUID());
                perf.setCreatedAt(LocalDateTime.now());
                return perf;
            });

            VendorDTO.PerformanceResponse response = vendorService.recordPerformance(testVendor.getId(), request);

            assertThat(response.getOverallScore()).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("getVendorPerformance")
    class GetVendorPerformanceTests {

        @Test
        @DisplayName("should return performance history for vendor")
        void shouldReturnPerformance_whenFound_givenVendorId() {
            VendorPerformance perf = VendorPerformance.builder()
                    .vendorId(testVendor.getId())
                    .qualityScore(new BigDecimal("4.50"))
                    .deliveryScore(new BigDecimal("4.00"))
                    .overallScore(new BigDecimal("4.25"))
                    .evaluationDate(LocalDateTime.now())
                    .evaluator("manager")
                    .build();
            perf.setTenantId(tenantId);
            perf.setId(UUID.randomUUID());
            perf.setCreatedAt(LocalDateTime.now());

            when(vendorRepository.findById(testVendor.getId())).thenReturn(Optional.of(testVendor));
            when(performanceRepository.findByVendorIdAndDeletedAtIsNull(testVendor.getId()))
                    .thenReturn(List.of(perf));

            List<VendorDTO.PerformanceResponse> performances = vendorService.getVendorPerformance(testVendor.getId());

            assertThat(performances).hasSize(1);
            assertThat(performances.get(0).getQualityScore()).isEqualByComparingTo(new BigDecimal("4.50"));
        }
    }

    @Nested
    @DisplayName("deleteVendor")
    class DeleteVendorTests {

        @Test
        @DisplayName("should soft delete vendor")
        void shouldSoftDelete_whenDeleting_givenExistingVendor() {
            when(vendorRepository.findById(testVendor.getId())).thenReturn(Optional.of(testVendor));
            when(vendorRepository.save(any(Vendor.class))).thenReturn(testVendor);

            vendorService.deleteVendor(testVendor.getId());

            assertThat(testVendor.isDeleted()).isTrue();
            verify(vendorRepository).save(any(Vendor.class));
        }
    }

    @Nested
    @DisplayName("listVendors")
    class ListVendorsTests {

        @Test
        @DisplayName("should return list of active vendors")
        void shouldReturnVendors_whenListing_givenActiveVendors() {
            when(vendorRepository.findByTenantIdAndDeletedAtIsNull(tenantId))
                    .thenReturn(List.of(testVendor));

            List<VendorDTO.VendorResponse> vendors = vendorService.listVendors();

            assertThat(vendors).hasSize(1);
            assertThat(vendors.get(0).getName()).isEqualTo("Acme Corp");
        }
    }
}
