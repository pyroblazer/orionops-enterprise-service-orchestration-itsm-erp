package com.orionops.modules.cmdb.service;

import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.modules.cmdb.dto.CIRequest;
import com.orionops.modules.cmdb.dto.CIResponse;
import com.orionops.modules.cmdb.dto.CIRelationshipResponse;
import com.orionops.modules.cmdb.dto.ServiceRequest;
import com.orionops.modules.cmdb.dto.ServiceResponse;
import com.orionops.modules.cmdb.entity.CIRelationship;
import com.orionops.modules.cmdb.entity.ConfigurationItem;
import com.orionops.modules.cmdb.entity.Service;
import com.orionops.modules.cmdb.repository.CIRelationshipRepository;
import com.orionops.modules.cmdb.repository.ConfigurationItemRepository;
import com.orionops.modules.cmdb.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@org.springframework.stereotype.Service
@RequiredArgsConstructor
public class CMDBService {

    private final ConfigurationItemRepository ciRepository;
    private final CIRelationshipRepository relationshipRepository;
    private final ServiceRepository serviceRepository;

    // --- Configuration Item operations ---

    @Transactional
    public CIResponse createCI(CIRequest request) {
        ConfigurationItem ci = ConfigurationItem.builder()
                .name(request.getName())
                .description(request.getDescription())
                .type(request.getType())
                .status(request.getStatus() != null ? request.getStatus() : ConfigurationItem.CIStatus.ACTIVE)
                .environment(request.getEnvironment())
                .ownerId(request.getOwnerId())
                .location(request.getLocation())
                .version(request.getVersion())
                .parentId(request.getParentId())
                .attributes(request.getAttributes())
                .build();
        ci.setTenantId(resolveTenantId());
        return mapToCIResponse(ciRepository.save(ci));
    }

    @Transactional(readOnly = true)
    public CIResponse getCI(UUID id) {
        return mapToCIResponse(findCIOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<CIResponse> listCIs(ConfigurationItem.CIType type, ConfigurationItem.CIStatus status, String search) {
        return ciRepository.searchCIs(resolveTenantId(), type, status, search != null ? search : "")
                .stream().map(this::mapToCIResponse).collect(Collectors.toList());
    }

    @Transactional
    public CIResponse updateCI(UUID id, CIRequest request) {
        ConfigurationItem ci = findCIOrThrow(id);
        if (request.getName() != null) ci.setName(request.getName());
        if (request.getDescription() != null) ci.setDescription(request.getDescription());
        if (request.getType() != null) ci.setType(request.getType());
        if (request.getStatus() != null) ci.setStatus(request.getStatus());
        if (request.getEnvironment() != null) ci.setEnvironment(request.getEnvironment());
        if (request.getOwnerId() != null) ci.setOwnerId(request.getOwnerId());
        if (request.getLocation() != null) ci.setLocation(request.getLocation());
        if (request.getVersion() != null) ci.setVersion(request.getVersion());
        if (request.getAttributes() != null) ci.setAttributes(request.getAttributes());
        return mapToCIResponse(ciRepository.save(ci));
    }

    @Transactional
    public void deleteCI(UUID id) {
        ConfigurationItem ci = findCIOrThrow(id);
        ci.softDelete();
        ciRepository.save(ci);
    }

    // --- Relationship operations ---

    @Transactional(readOnly = true)
    public List<CIRelationshipResponse> getRelationships(UUID ciId) {
        findCIOrThrow(ciId);
        List<CIRelationship> relationships = relationshipRepository.findByCiId(ciId);
        return relationships.stream().map(r -> mapToRelationshipResponse(r, ciId)).collect(Collectors.toList());
    }

    @Transactional
    public CIRelationshipResponse createRelationship(UUID sourceCiId, UUID targetCiId, String type, String description) {
        findCIOrThrow(sourceCiId);
        findCIOrThrow(targetCiId);
        CIRelationship rel = CIRelationship.builder()
                .sourceCiId(sourceCiId)
                .targetCiId(targetCiId)
                .relationshipType(type)
                .description(description)
                .build();
        rel.setTenantId(resolveTenantId());
        return mapToRelationshipResponse(relationshipRepository.save(rel), sourceCiId);
    }

    // --- Impact Analysis ---

    @Transactional(readOnly = true)
    public List<CIResponse> getImpactAnalysis(UUID ciId) {
        findCIOrThrow(ciId);
        List<CIRelationship> allRels = relationshipRepository.findByCiId(ciId);
        List<UUID> relatedCiIds = new ArrayList<>();
        for (CIRelationship rel : allRels) {
            if (rel.getSourceCiId().equals(ciId)) {
                relatedCiIds.add(rel.getTargetCiId());
            } else {
                relatedCiIds.add(rel.getSourceCiId());
            }
        }
        // BFS one more level for transitive impact
        for (UUID relatedId : new ArrayList<>(relatedCiIds)) {
            List<CIRelationship> nextLevel = relationshipRepository.findByCiId(relatedId);
            for (CIRelationship rel : nextLevel) {
                if (!rel.getSourceCiId().equals(ciId) && !rel.getTargetCiId().equals(ciId)) {
                    if (rel.getSourceCiId().equals(relatedId)) relatedCiIds.add(rel.getTargetCiId());
                    else relatedCiIds.add(rel.getSourceCiId());
                }
            }
        }
        return ciRepository.findAllById(relatedCiIds).stream()
                .filter(ci -> !ci.isDeleted())
                .map(this::mapToCIResponse)
                .collect(Collectors.toList());
    }

    // --- Service operations ---

    @Transactional
    public ServiceResponse createService(ServiceRequest request) {
        Service service = Service.builder()
                .name(request.getName())
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus() : Service.ServiceStatus.ACTIVE)
                .owner(request.getOwner())
                .supportGroup(request.getSupportGroup())
                .category(request.getCategory())
                .build();
        service.setTenantId(resolveTenantId());
        return mapToServiceResponse(serviceRepository.save(service));
    }

    @Transactional(readOnly = true)
    public List<ServiceResponse> listServices() {
        return serviceRepository.findByTenantIdAndDeletedAtIsNull(resolveTenantId())
                .stream().map(this::mapToServiceResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ServiceResponse getService(UUID id) {
        return mapToServiceResponse(findServiceOrThrow(id));
    }

    @Transactional
    public void deleteService(UUID id) {
        Service service = findServiceOrThrow(id);
        service.softDelete();
        serviceRepository.save(service);
    }

    private ConfigurationItem findCIOrThrow(UUID id) {
        return ciRepository.findById(id)
                .filter(ci -> !ci.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("ConfigurationItem", id));
    }

    private Service findServiceOrThrow(UUID id) {
        return serviceRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Service", id));
    }

    private UUID resolveTenantId() {
        return UUID.fromString("00000000-0000-0000-0000-000000000001");
    }

    private CIResponse mapToCIResponse(ConfigurationItem ci) {
        return CIResponse.builder()
                .id(ci.getId()).name(ci.getName()).description(ci.getDescription())
                .type(ci.getType()).status(ci.getStatus()).environment(ci.getEnvironment())
                .ownerId(ci.getOwnerId()).location(ci.getLocation()).version(ci.getVersion())
                .parentId(ci.getParentId()).attributes(ci.getAttributes())
                .tenantId(ci.getTenantId()).createdBy(ci.getCreatedBy())
                .createdAt(ci.getCreatedAt()).updatedAt(ci.getUpdatedAt()).build();
    }

    private CIRelationshipResponse mapToRelationshipResponse(CIRelationship rel, UUID contextCiId) {
        String sourceName = ciRepository.findById(rel.getSourceCiId()).map(ConfigurationItem::getName).orElse("Unknown");
        String targetName = ciRepository.findById(rel.getTargetCiId()).map(ConfigurationItem::getName).orElse("Unknown");
        return CIRelationshipResponse.builder()
                .id(rel.getId()).sourceCiId(rel.getSourceCiId()).targetCiId(rel.getTargetCiId())
                .relationshipType(rel.getRelationshipType()).description(rel.getDescription())
                .sourceCiName(sourceName).targetCiName(targetName).build();
    }

    private ServiceResponse mapToServiceResponse(Service s) {
        return ServiceResponse.builder()
                .id(s.getId()).name(s.getName()).description(s.getDescription())
                .status(s.getStatus()).owner(s.getOwner()).supportGroup(s.getSupportGroup())
                .category(s.getCategory()).tenantId(s.getTenantId()).createdBy(s.getCreatedBy())
                .createdAt(s.getCreatedAt()).updatedAt(s.getUpdatedAt()).build();
    }
}
