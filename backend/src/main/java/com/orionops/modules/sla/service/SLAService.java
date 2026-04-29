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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SLAService {

    private final SLADefinitionRepository definitionRepository;
    private final SLAInstanceRepository instanceRepository;
    private final EventPublisher eventPublisher;

    @Transactional
    public SLADefinitionResponse createDefinition(SLADefinitionRequest request) {
        SLADefinition def = SLADefinition.builder()
                .name(request.getName())
                .description(request.getDescription())
                .responseTimeHours(request.getResponseTimeHours())
                .resolutionTimeHours(request.getResolutionTimeHours())
                .entityType(request.getEntityType())
                .priority(request.getPriority())
                .serviceId(request.getServiceId())
                .slaType(request.getSlaType() != null ? request.getSlaType() : SLADefinition.SLAType.SLA)
                .tenantId(resolveTenantId())
                .build();
        return mapDefinitionToResponse(definitionRepository.save(def));
    }

    @Transactional(readOnly = true)
    public List<SLADefinitionResponse> listDefinitions() {
        return definitionRepository.findByTenantIdAndDeletedAtIsNull(resolveTenantId())
                .stream().map(this::mapDefinitionToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SLADefinitionResponse getDefinition(UUID id) {
        return mapDefinitionToResponse(findDefinitionOrThrow(id));
    }

    @Transactional
    public SLAInstanceResponse applySLA(UUID definitionId, UUID targetEntityId, String targetType) {
        SLADefinition def = findDefinitionOrThrow(definitionId);
        LocalDateTime now = LocalDateTime.now();

        SLAInstance instance = SLAInstance.builder()
                .slaDefinitionId(def.getId())
                .targetEntityId(targetEntityId)
                .targetType(targetType)
                .status(SLAInstance.SLAStatus.ACTIVE)
                .responseTarget(now.plusHours(def.getResponseTimeHours()))
                .resolutionTarget(now.plusHours(def.getResolutionTimeHours()))
                .tenantId(resolveTenantId())
                .build();

        SLAInstance saved = instanceRepository.save(instance);

        eventPublisher.publish(SLACreatedEvent.builder()
                .aggregateId(saved.getId())
                .slaInstanceId(saved.getId())
                .targetEntityId(targetEntityId)
                .targetType(targetType)
                .slaDefinitionId(def.getId())
                .build());

        return mapInstanceToResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<SLAInstanceResponse> listInstances(SLAInstance.SLAStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<SLAInstance> instances;
        if (status != null) {
            instances = instanceRepository.findByTenantIdAndStatusAndDeletedAtIsNull(resolveTenantId(), status, pageable);
        } else {
            instances = instanceRepository.findByTenantIdAndDeletedAtIsNull(resolveTenantId(), pageable);
        }
        return instances.map(this::mapInstanceToResponse);
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void checkSLABreaches() {
        LocalDateTime now = LocalDateTime.now();
        List<SLAInstance> activeInstances = instanceRepository.findByTenantIdAndStatusAndDeletedAtIsNull(
                resolveTenantId(), SLAInstance.SLAStatus.ACTIVE, PageRequest.of(0, 100)).getContent();

        for (SLAInstance instance : activeInstances) {
            boolean updated = false;
            if (now.isAfter(instance.getResolutionTarget()) && instance.getStatus() != SLAInstance.SLAStatus.BREACHED) {
                instance.setStatus(SLAInstance.SLAStatus.BREACHED);
                instance.setBreachedAt(now);
                updated = true;
                eventPublisher.publish(SLABreachEvent.builder()
                        .aggregateId(instance.getId())
                        .slaInstanceId(instance.getId())
                        .targetEntityId(instance.getTargetEntityId())
                        .targetType(instance.getTargetType())
                        .breachType("RESOLUTION")
                        .build());
            } else if (now.isAfter(instance.getResponseTarget().minusHours(1)) && instance.getRespondedAt() == null) {
                instance.setStatus(SLAInstance.SLAStatus.AT_RISK);
                updated = true;
            }
            if (updated) {
                instanceRepository.save(instance);
            }
        }
    }

    @Transactional
    public void deleteDefinition(UUID id) {
        SLADefinition def = findDefinitionOrThrow(id);
        def.softDelete();
        definitionRepository.save(def);
    }

    private SLADefinition findDefinitionOrThrow(UUID id) {
        return definitionRepository.findById(id)
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("SLADefinition", id));
    }

    private UUID resolveTenantId() {
        return UUID.fromString("00000000-0000-0000-0000-000000000001");
    }

    private SLADefinitionResponse mapDefinitionToResponse(SLADefinition d) {
        return SLADefinitionResponse.builder()
                .id(d.getId()).name(d.getName()).description(d.getDescription())
                .responseTimeHours(d.getResponseTimeHours()).resolutionTimeHours(d.getResolutionTimeHours())
                .entityType(d.getEntityType()).priority(d.getPriority()).serviceId(d.getServiceId())
                .slaType(d.getSlaType()).active(d.isActive())
                .createdAt(d.getCreatedAt()).updatedAt(d.getUpdatedAt()).build();
    }

    private SLAInstanceResponse mapInstanceToResponse(SLAInstance i) {
        return SLAInstanceResponse.builder()
                .id(i.getId()).slaDefinitionId(i.getSlaDefinitionId())
                .targetEntityId(i.getTargetEntityId()).targetType(i.getTargetType())
                .status(i.getStatus()).responseTarget(i.getResponseTarget())
                .resolutionTarget(i.getResolutionTarget()).respondedAt(i.getRespondedAt())
                .resolvedAt(i.getResolvedAt()).breachedAt(i.getBreachedAt())
                .createdAt(i.getCreatedAt()).build();
    }
}
