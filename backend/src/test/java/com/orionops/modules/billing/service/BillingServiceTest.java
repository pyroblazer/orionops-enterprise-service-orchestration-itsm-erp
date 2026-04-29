package com.orionops.modules.billing.service;

import com.orionops.common.event.EventPublisher;
import com.orionops.modules.billing.dto.BillingDTO;
import com.orionops.modules.billing.entity.BillingRecord;
import com.orionops.modules.billing.entity.ServiceUsage;
import com.orionops.modules.billing.event.InvoiceGeneratedEvent;
import com.orionops.modules.billing.event.UsageRecordedEvent;
import com.orionops.modules.billing.repository.BillingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link BillingService}.
 * Covers usage recording, invoice generation, and event publishing.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("BillingService")
class BillingServiceTest {

    @Mock
    private BillingRepository.ServiceUsageRepository usageRepository;

    @Mock
    private BillingRepository.BillingRecordRepository billingRepository;

    @Mock
    private BillingRepository.CostModelRepository costModelRepository;

    @Mock
    private EventPublisher eventPublisher;

    @InjectMocks
    private BillingService billingService;

    private UUID tenantId;
    private UUID serviceId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        serviceId = UUID.randomUUID();
    }

    @Nested
    @DisplayName("recordUsage")
    class RecordUsageTests {

        @Test
        @DisplayName("should record usage and publish UsageRecordedEvent")
        void shouldRecordUsage_whenValidRequest_givenAllFields() {
            BigDecimal quantity = new BigDecimal("100");
            BigDecimal unitCost = new BigDecimal("0.50");

            BillingDTO.UsageRequest request = BillingDTO.UsageRequest.builder()
                    .serviceId(serviceId)
                    .tenantEntityId(UUID.randomUUID())
                    .usageType("API_CALLS")
                    .quantity(quantity)
                    .unitCost(unitCost)
                    .description("API usage for January")
                    .build();

            when(usageRepository.save(any(ServiceUsage.class))).thenAnswer(invocation -> {
                ServiceUsage usage = invocation.getArgument(0);
                usage.setId(UUID.randomUUID());
                usage.setCreatedAt(LocalDateTime.now());
                return usage;
            });

            BillingDTO.UsageResponse response = billingService.recordUsage(request);

            assertThat(response).isNotNull();
            assertThat(response.getServiceId()).isEqualTo(serviceId);
            assertThat(response.getTotalCost()).isEqualByComparingTo(new BigDecimal("50.00"));
            assertThat(response.getUsageType()).isEqualTo("API_CALLS");

            ArgumentCaptor<ServiceUsage> captor = ArgumentCaptor.forClass(ServiceUsage.class);
            verify(usageRepository).save(captor.capture());
            assertThat(captor.getValue().getTotalCost()).isEqualByComparingTo(new BigDecimal("50.00"));

            verify(eventPublisher).publish(any(UsageRecordedEvent.class));
        }

        @Test
        @DisplayName("should use default unit cost of 1 when null")
        void shouldUseDefaultUnitCost_whenNull_givenNoUnitCost() {
            BillingDTO.UsageRequest request = BillingDTO.UsageRequest.builder()
                    .serviceId(serviceId)
                    .tenantEntityId(UUID.randomUUID())
                    .usageType("STORAGE")
                    .quantity(new BigDecimal("50"))
                    .build();

            when(usageRepository.save(any(ServiceUsage.class))).thenAnswer(invocation -> {
                ServiceUsage usage = invocation.getArgument(0);
                usage.setId(UUID.randomUUID());
                usage.setCreatedAt(LocalDateTime.now());
                return usage;
            });

            BillingDTO.UsageResponse response = billingService.recordUsage(request);

            assertThat(response.getTotalCost()).isEqualByComparingTo(new BigDecimal("50"));
        }
    }

    @Nested
    @DisplayName("generateInvoice")
    class GenerateInvoiceTests {

        @Test
        @DisplayName("should aggregate usage into billing record and publish InvoiceGeneratedEvent")
        void shouldGenerateInvoice_whenValidPeriod_givenUsageRecords() {
            LocalDateTime periodStart = LocalDateTime.now().minusMonths(1);
            LocalDateTime periodEnd = LocalDateTime.now();

            ServiceUsage usage1 = ServiceUsage.builder()
                    .serviceId(serviceId).totalCost(new BigDecimal("100.00"))
                    .tenantId(tenantId).usageDate(periodStart.plusDays(5)).build();
            usage1.setId(UUID.randomUUID());

            ServiceUsage usage2 = ServiceUsage.builder()
                    .serviceId(serviceId).totalCost(new BigDecimal("200.00"))
                    .tenantId(tenantId).usageDate(periodStart.plusDays(15)).build();
            usage2.setId(UUID.randomUUID());

            when(usageRepository.findByPeriod(any(UUID.class), any(LocalDateTime.class), any(LocalDateTime.class)))
                    .thenReturn(List.of(usage1, usage2));

            when(billingRepository.save(any(BillingRecord.class))).thenAnswer(invocation -> {
                BillingRecord record = invocation.getArgument(0);
                record.setId(UUID.randomUUID());
                record.setCreatedAt(LocalDateTime.now());
                return record;
            });

            BillingDTO.GenerateInvoiceRequest request = BillingDTO.GenerateInvoiceRequest.builder()
                    .periodStart(periodStart)
                    .periodEnd(periodEnd)
                    .build();

            BillingDTO.BillingRecordResponse response = billingService.generateInvoice(request);

            assertThat(response).isNotNull();
            assertThat(response.getAmount()).isEqualByComparingTo(new BigDecimal("300.00"));
            assertThat(response.getTaxAmount()).isEqualByComparingTo(new BigDecimal("30.00"));
            assertThat(response.getInvoiceNumber()).startsWith("INV-");

            ArgumentCaptor<BillingRecord> captor = ArgumentCaptor.forClass(BillingRecord.class);
            verify(billingRepository).save(captor.capture());
            assertThat(captor.getValue().getAmount()).isEqualByComparingTo(new BigDecimal("300.00"));
            assertThat(captor.getValue().getTaxAmount()).isEqualByComparingTo(new BigDecimal("30.00"));

            verify(eventPublisher).publish(any(InvoiceGeneratedEvent.class));
        }

        @Test
        @DisplayName("should generate zero invoice when no usage in period")
        void shouldGenerateZeroInvoice_whenNoUsage_givenEmptyPeriod() {
            LocalDateTime periodStart = LocalDateTime.now().minusMonths(1);
            LocalDateTime periodEnd = LocalDateTime.now();

            when(usageRepository.findByPeriod(any(UUID.class), any(LocalDateTime.class), any(LocalDateTime.class)))
                    .thenReturn(Collections.emptyList());

            when(billingRepository.save(any(BillingRecord.class))).thenAnswer(invocation -> {
                BillingRecord record = invocation.getArgument(0);
                record.setId(UUID.randomUUID());
                record.setCreatedAt(LocalDateTime.now());
                return record;
            });

            BillingDTO.GenerateInvoiceRequest request = BillingDTO.GenerateInvoiceRequest.builder()
                    .periodStart(periodStart)
                    .periodEnd(periodEnd)
                    .build();

            BillingDTO.BillingRecordResponse response = billingService.generateInvoice(request);

            assertThat(response.getAmount()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(response.getTaxAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("listUsages")
    class ListUsagesTests {

        @Test
        @DisplayName("should return list of usage records")
        void shouldReturnUsages_whenListing_givenExistingRecords() {
            ServiceUsage usage = ServiceUsage.builder()
                    .serviceId(serviceId).usageType("API").quantity(BigDecimal.TEN)
                    .totalCost(BigDecimal.valueOf(50)).tenantId(tenantId)
                    .usageDate(LocalDateTime.now()).build();
            usage.setId(UUID.randomUUID());
            usage.setCreatedAt(LocalDateTime.now());

            when(usageRepository.findByTenantIdAndDeletedAtIsNull(tenantId))
                    .thenReturn(List.of(usage));

            List<BillingDTO.UsageResponse> result = billingService.listUsages();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getServiceId()).isEqualTo(serviceId);
        }
    }
}
