package com.orionops.modules.sla.service;

import com.orionops.common.event.EventPublisher;
import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.modules.sla.dto.SLADefinitionRequest;
import com.orionops.modules.sla.dto.SLADefinitionResponse;
import com.orionops.modules.sla.dto.SLAInstanceResponse;
import com.orionops.modules.sla.entity.SLADefinition;
import com.orionops.modules.sla.entity.SLAInstance;
import com.orionops.modules.sla.event.SLABreachEvent;
import com.orionops.modules.sla.event.SLACreatedEvent;
import com.orionops.modules.sla.repository.SLADefinitionRepository;
import com.orionops.modules.sla.repository.SLAInstanceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link SLAService}.
 * Covers SLA application, breach detection, timer calculations, and definitions.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SLAService")
class SLAServiceTest {

    @Mock
    private SLADefinitionRepository definitionRepository;

    @Mock
    private SLAInstanceRepository instanceRepository;

    @Mock
    private EventPublisher eventPublisher;

    @InjectMocks
    private SLAService slaService;

    private SLADefinition testDefinition;
    private SLAInstance testInstance;
    private UUID tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        testDefinition = SLADefinition.builder()
                .name("P1 SLA")
                .description("Priority 1 SLA")
                .responseTimeHours(1)
                .resolutionTimeHours(4)
                .entityType("incident")
                .priority("CRITICAL")
                .slaType(SLADefinition.SLAType.SLA)
                .tenantId(tenantId)
                .build();
        testDefinition.setId(UUID.randomUUID());
        testDefinition.setCreatedAt(LocalDateTime.now());
        testDefinition.setUpdatedAt(LocalDateTime.now());

        testInstance = SLAInstance.builder()
                .slaDefinitionId(testDefinition.getId())
                .targetEntityId(UUID.randomUUID())
                .targetType("incident")
                .status(SLAInstance.SLAStatus.ACTIVE)
                .responseTarget(LocalDateTime.now().plusHours(1))
                .resolutionTarget(LocalDateTime.now().plusHours(4))
                .tenantId(tenantId)
                .build();
        testInstance.setId(UUID.randomUUID());
        testInstance.setCreatedAt(LocalDateTime.now());
        testInstance.setUpdatedAt(LocalDateTime.now());
    }

    @Nested
    @DisplayName("createDefinition")
    class CreateDefinitionTests {

        @Test
        @DisplayName("should create SLA definition")
        void shouldCreateDefinition_whenValidRequest_givenAllFields() {
            SLADefinitionRequest request = SLADefinitionRequest.builder()
                    .name("Standard SLA")
                    .description("Standard incident SLA")
                    .responseTimeHours(4)
                    .resolutionTimeHours(24)
                    .entityType("incident")
                    .priority("MEDIUM")
                    .build();

            when(definitionRepository.save(any(SLADefinition.class))).thenAnswer(invocation -> {
                SLADefinition def = invocation.getArgument(0);
                def.setId(UUID.randomUUID());
                def.setCreatedAt(LocalDateTime.now());
                def.setUpdatedAt(LocalDateTime.now());
                return def;
            });

            SLADefinitionResponse response = slaService.createDefinition(request);

            assertThat(response).isNotNull();
            assertThat(response.getName()).isEqualTo("Standard SLA");
            assertThat(response.getResponseTimeHours()).isEqualTo(4);
            assertThat(response.getResolutionTimeHours()).isEqualTo(24);
        }
    }

    @Nested
    @DisplayName("applySLA")
    class ApplySLATests {

        @Test
        @DisplayName("should create SLA instance with correct target times")
        void shouldApplySLA_whenValid_givenDefinitionAndTarget() {
            UUID targetEntityId = UUID.randomUUID();
            LocalDateTime beforeApply = LocalDateTime.now();

            when(definitionRepository.findById(testDefinition.getId())).thenReturn(Optional.of(testDefinition));
            when(instanceRepository.save(any(SLAInstance.class))).thenAnswer(invocation -> {
                SLAInstance inst = invocation.getArgument(0);
                inst.setId(UUID.randomUUID());
                inst.setCreatedAt(LocalDateTime.now());
                inst.setUpdatedAt(LocalDateTime.now());
                return inst;
            });

            SLAInstanceResponse response = slaService.applySLA(testDefinition.getId(), targetEntityId, "incident");

            assertThat(response).isNotNull();
            assertThat(response.getStatus()).isEqualTo(SLAInstance.SLAStatus.ACTIVE);

            ArgumentCaptor<SLAInstance> captor = ArgumentCaptor.forClass(SLAInstance.class);
            verify(instanceRepository).save(captor.capture());
            SLAInstance saved = captor.getValue();
            assertThat(saved.getResponseTarget()).isAfter(beforeApply);
            assertThat(saved.getResolutionTarget()).isAfter(beforeApply.plusHours(3));
            assertThat(saved.getSlaDefinitionId()).isEqualTo(testDefinition.getId());
            assertThat(saved.getTargetEntityId()).isEqualTo(targetEntityId);

            verify(eventPublisher).publish(any(SLACreatedEvent.class));
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when definition not found")
        void shouldThrowNotFoundException_whenDefinitionMissing_givenInvalidId() {
            UUID randomId = UUID.randomUUID();
            when(definitionRepository.findById(randomId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> slaService.applySLA(randomId, UUID.randomUUID(), "incident"))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("checkSLABreaches")
    class CheckSLABreachesTests {

        @Test
        @DisplayName("should detect breach when resolution target is past")
        void shouldDetectBreach_whenPastTarget_givenActiveInstance() {
            testInstance.setResolutionTarget(LocalDateTime.now().minusHours(1));
            testInstance.setResponseTarget(LocalDateTime.now().minusHours(2));

            Page<SLAInstance> page = new PageImpl<>(List.of(testInstance));
            when(instanceRepository.findByTenantIdAndStatusAndDeletedAtIsNull(
                    eq(tenantId), eq(SLAInstance.SLAStatus.ACTIVE), any(Pageable.class)))
                    .thenReturn(page);
            when(instanceRepository.save(any(SLAInstance.class))).thenReturn(testInstance);

            slaService.checkSLABreaches();

            ArgumentCaptor<SLAInstance> captor = ArgumentCaptor.forClass(SLAInstance.class);
            verify(instanceRepository).save(captor.capture());
            assertThat(captor.getValue().getStatus()).isEqualTo(SLAInstance.SLAStatus.BREACHED);
            assertThat(captor.getValue().getBreachedAt()).isNotNull();

            verify(eventPublisher).publish(any(SLABreachEvent.class));
        }

        @Test
        @DisplayName("should not breach when targets are in the future")
        void shouldNotBreach_whenTargetsFuture_givenActiveInstance() {
            testInstance.setResolutionTarget(LocalDateTime.now().plusHours(4));
            testInstance.setResponseTarget(LocalDateTime.now().plusHours(1));

            Page<SLAInstance> page = new PageImpl<>(List.of(testInstance));
            when(instanceRepository.findByTenantIdAndStatusAndDeletedAtIsNull(
                    eq(tenantId), eq(SLAInstance.SLAStatus.ACTIVE), any(Pageable.class)))
                    .thenReturn(page);

            slaService.checkSLABreaches();

            verify(eventPublisher, org.mockito.Mockito.never()).publish(any(SLABreachEvent.class));
        }

        @Test
        @DisplayName("should set AT_RISK status when response deadline approaches")
        void shouldSetAtRisk_whenResponseApproaches_givenActiveInstance() {
            testInstance.setResponseTarget(LocalDateTime.now().plusMinutes(30));
            testInstance.setResolutionTarget(LocalDateTime.now().plusHours(4));
            testInstance.setRespondedAt(null);

            Page<SLAInstance> page = new PageImpl<>(List.of(testInstance));
            when(instanceRepository.findByTenantIdAndStatusAndDeletedAtIsNull(
                    eq(tenantId), eq(SLAInstance.SLAStatus.ACTIVE), any(Pageable.class)))
                    .thenReturn(page);
            when(instanceRepository.save(any(SLAInstance.class))).thenReturn(testInstance);

            slaService.checkSLABreaches();

            ArgumentCaptor<SLAInstance> captor = ArgumentCaptor.forClass(SLAInstance.class);
            verify(instanceRepository).save(captor.capture());
            assertThat(captor.getValue().getStatus()).isEqualTo(SLAInstance.SLAStatus.AT_RISK);
        }
    }

    @Nested
    @DisplayName("listInstances")
    class ListInstancesTests {

        @Test
        @DisplayName("should return paginated SLA instances")
        void shouldReturnPaginatedInstances_whenListing_givenNoFilters() {
            Page<SLAInstance> page = new PageImpl<>(List.of(testInstance));
            when(instanceRepository.findByTenantIdAndDeletedAtIsNull(eq(tenantId), any(Pageable.class)))
                    .thenReturn(page);

            Page<SLAInstanceResponse> result = slaService.listInstances(null, 0, 20);

            assertThat(result.getContent()).hasSize(1);
        }

        @Test
        @DisplayName("should filter by status")
        void shouldFilterByStatus_whenListing_givenStatusFilter() {
            Page<SLAInstance> page = new PageImpl<>(List.of(testInstance));
            when(instanceRepository.findByTenantIdAndStatusAndDeletedAtIsNull(
                    eq(tenantId), eq(SLAInstance.SLAStatus.ACTIVE), any(Pageable.class)))
                    .thenReturn(page);

            Page<SLAInstanceResponse> result = slaService.listInstances(SLAInstance.SLAStatus.ACTIVE, 0, 20);

            assertThat(result.getContent()).hasSize(1);
        }
    }
}
