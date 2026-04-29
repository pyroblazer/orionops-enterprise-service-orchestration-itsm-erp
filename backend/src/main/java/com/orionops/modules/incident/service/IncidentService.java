package com.orionops.modules.incident.service;

import com.orionops.common.auditing.BaseEntity;
import com.orionops.common.event.EventPublisher;
import com.orionops.common.exception.BusinessRuleException;
import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.modules.incident.dto.CreateIncidentRequest;
import com.orionops.modules.incident.dto.IncidentResponse;
import com.orionops.modules.incident.dto.UpdateIncidentRequest;
import com.orionops.modules.incident.entity.Incident;
import com.orionops.modules.incident.event.IncidentAssignedEvent;
import com.orionops.modules.incident.event.IncidentCreatedEvent;
import com.orionops.modules.incident.event.IncidentEscalatedEvent;
import com.orionops.modules.incident.event.IncidentResolvedEvent;
import com.orionops.modules.incident.repository.IncidentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Service for incident management with CQRS-style event sourcing.
 * All state mutations emit domain events that are published to Kafka.
 * Events enable audit trails, read model projections, and cross-module integration.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final EventPublisher eventPublisher;

    /**
     * Creates a new incident, persists it, and publishes an IncidentCreatedEvent.
     */
    @Transactional
    public IncidentResponse createIncident(CreateIncidentRequest request) {
        log.info("Creating incident: title={}", request.getTitle());

        Incident incident = Incident.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(request.getPriority() != null ? request.getPriority() : Incident.IncidentPriority.MEDIUM)
                .impact(request.getImpact() != null ? request.getImpact() : Incident.IncidentImpact.MODERATE)
                .urgency(request.getUrgency() != null ? request.getUrgency() : Incident.IncidentUrgency.MEDIUM)
                .status(Incident.IncidentStatus.OPEN)
                .category(request.getCategory())
                .subcategory(request.getSubcategory())
                .serviceId(request.getServiceId())
                .ciId(request.getCiId())
                .assigneeId(request.getAssigneeId())
                .assigneeGroupId(request.getAssigneeGroupId())
                .reporterId(request.getReporterId() != null ? request.getReporterId() : resolveCurrentUserId())
                .parentIncidentId(request.getParentIncidentId())
                .escalationLevel(0)
                .tenantId(resolveTenantId())
                .build();

        calculateSlaTargets(incident);

        Incident saved = incidentRepository.save(incident);
        log.info("Incident created: id={}, title={}", saved.getId(), saved.getTitle());

        // Publish event for CQRS projections, notifications, audit
        IncidentCreatedEvent event = IncidentCreatedEvent.builder()
                .aggregateId(saved.getId())
                .incidentId(saved.getId())
                .title(saved.getTitle())
                .priority(saved.getPriority().name())
                .category(saved.getCategory())
                .serviceId(saved.getServiceId())
                .reporterId(saved.getReporterId())
                .assigneeId(saved.getAssigneeId())
                .build();
        eventPublisher.publish(event);

        return mapToResponse(saved);
    }

    /**
     * Updates an existing incident's mutable fields.
     */
    @Transactional
    public IncidentResponse updateIncident(UUID id, UpdateIncidentRequest request) {
        Incident incident = findIncidentOrThrow(id);

        if (incident.getStatus() == Incident.IncidentStatus.CLOSED || incident.getStatus() == Incident.IncidentStatus.CANCELLED) {
            throw new BusinessRuleException("Cannot update a closed or cancelled incident");
        }

        if (request.getTitle() != null) incident.setTitle(request.getTitle());
        if (request.getDescription() != null) incident.setDescription(request.getDescription());
        if (request.getPriority() != null) incident.setPriority(request.getPriority());
        if (request.getImpact() != null) incident.setImpact(request.getImpact());
        if (request.getUrgency() != null) incident.setUrgency(request.getUrgency());
        if (request.getCategory() != null) incident.setCategory(request.getCategory());
        if (request.getSubcategory() != null) incident.setSubcategory(request.getSubcategory());
        if (request.getServiceId() != null) incident.setServiceId(request.getServiceId());
        if (request.getCiId() != null) incident.setCiId(request.getCiId());
        if (request.getAssigneeId() != null) incident.setAssigneeId(request.getAssigneeId());
        if (request.getAssigneeGroupId() != null) incident.setAssigneeGroupId(request.getAssigneeGroupId());

        if (incident.getStatus() == Incident.IncidentStatus.OPEN) {
            incident.setStatus(Incident.IncidentStatus.IN_PROGRESS);
        }

        Incident saved = incidentRepository.save(incident);
        return mapToResponse(saved);
    }

    /**
     * Assigns an incident to a user and/or group.
     */
    @Transactional
    public IncidentResponse assignIncident(UUID id, UUID assigneeId, UUID groupId) {
        Incident incident = findIncidentOrThrow(id);

        if (incident.getStatus() == Incident.IncidentStatus.CLOSED || incident.getStatus() == Incident.IncidentStatus.CANCELLED) {
            throw new BusinessRuleException("Cannot assign a closed or cancelled incident");
        }

        incident.setAssigneeId(assigneeId);
        incident.setAssigneeGroupId(groupId);
        if (incident.getStatus() == Incident.IncidentStatus.OPEN) {
            incident.setStatus(Incident.IncidentStatus.IN_PROGRESS);
        }

        Incident saved = incidentRepository.save(incident);

        IncidentAssignedEvent event = IncidentAssignedEvent.builder()
                .aggregateId(saved.getId())
                .incidentId(saved.getId())
                .assigneeId(assigneeId)
                .assigneeGroupId(groupId)
                .assignedBy(resolveCurrentUser())
                .build();
        eventPublisher.publish(event);

        return mapToResponse(saved);
    }

    /**
     * Escalates an incident to a higher support tier.
     */
    @Transactional
    public IncidentResponse escalateIncident(UUID id, String reason, UUID newAssigneeId) {
        Incident incident = findIncidentOrThrow(id);

        if (incident.getStatus() == Incident.IncidentStatus.CLOSED || incident.getStatus() == Incident.IncidentStatus.CANCELLED) {
            throw new BusinessRuleException("Cannot escalate a closed or cancelled incident");
        }

        int newLevel = (incident.getEscalationLevel() != null ? incident.getEscalationLevel() : 0) + 1;
        incident.setEscalationLevel(newLevel);
        if (newAssigneeId != null) {
            incident.setAssigneeId(newAssigneeId);
        }
        incident.setStatus(Incident.IncidentStatus.IN_PROGRESS);

        Incident saved = incidentRepository.save(incident);

        IncidentEscalatedEvent event = IncidentEscalatedEvent.builder()
                .aggregateId(saved.getId())
                .incidentId(saved.getId())
                .escalationLevel(newLevel)
                .escalationReason(reason)
                .escalatedBy(resolveCurrentUserId())
                .newAssigneeId(newAssigneeId)
                .build();
        eventPublisher.publish(event);

        return mapToResponse(saved);
    }

    /**
     * Resolves an incident with resolution details.
     */
    @Transactional
    public IncidentResponse resolveIncident(UUID id, String resolution, String resolutionCode) {
        Incident incident = findIncidentOrThrow(id);

        if (incident.getStatus() == Incident.IncidentStatus.RESOLVED || incident.getStatus() == Incident.IncidentStatus.CLOSED) {
            throw new BusinessRuleException("Incident is already resolved or closed");
        }

        incident.setStatus(Incident.IncidentStatus.RESOLVED);
        incident.setResolution(resolution);
        incident.setResolutionCode(resolutionCode);
        incident.setResolvedAt(LocalDateTime.now());
        incident.setResolvedBy(resolveCurrentUserId());

        Incident saved = incidentRepository.save(incident);

        IncidentResolvedEvent event = IncidentResolvedEvent.builder()
                .aggregateId(saved.getId())
                .incidentId(saved.getId())
                .resolvedBy(saved.getResolvedBy())
                .resolution(resolution)
                .resolutionCode(resolutionCode)
                .build();
        eventPublisher.publish(event);

        return mapToResponse(saved);
    }

    /**
     * Closes a resolved incident.
     */
    @Transactional
    public IncidentResponse closeIncident(UUID id, String closureCode) {
        Incident incident = findIncidentOrThrow(id);

        if (incident.getStatus() != Incident.IncidentStatus.RESOLVED) {
            throw new BusinessRuleException("Incident must be resolved before it can be closed");
        }

        incident.setStatus(Incident.IncidentStatus.CLOSED);
        incident.setClosureCode(closureCode);
        incident.setClosedAt(LocalDateTime.now());
        incident.setClosedBy(resolveCurrentUserId());

        Incident saved = incidentRepository.save(incident);
        return mapToResponse(saved);
    }

    /**
     * Retrieves an incident by ID.
     */
    @Transactional(readOnly = true)
    public IncidentResponse getIncident(UUID id) {
        return mapToResponse(findIncidentOrThrow(id));
    }

    /**
     * Searches incidents with pagination and filters.
     */
    @Transactional(readOnly = true)
    public Page<IncidentResponse> searchIncidents(
            Incident.IncidentStatus status,
            Incident.IncidentPriority priority,
            UUID assigneeId,
            UUID serviceId,
            String category,
            String search,
            int page, int size, String sort, String direction) {

        Sort.Direction sortDirection = Sort.Direction.fromString(direction);
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));
        UUID tenantId = resolveTenantId();

        Page<Incident> incidents = incidentRepository.searchIncidents(
                tenantId, status, priority, assigneeId, serviceId, category,
                search != null ? search : "", pageable);

        return incidents.map(this::mapToResponse);
    }

    /**
     * Soft-deletes an incident.
     */
    @Transactional
    public void deleteIncident(UUID id) {
        Incident incident = findIncidentOrThrow(id);
        incident.softDelete();
        incidentRepository.save(incident);
        log.info("Incident soft-deleted: id={}", id);
    }

    private Incident findIncidentOrThrow(UUID id) {
        return incidentRepository.findById(id)
                .filter(i -> !i.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Incident", id));
    }

    private void calculateSlaTargets(Incident incident) {
        LocalDateTime now = LocalDateTime.now();
        // Simplified SLA target calculation based on priority
        switch (incident.getPriority()) {
            case CRITICAL -> {
                incident.setSlaResponseTarget(now.plusHours(1));
                incident.setSlaResolutionTarget(now.plusHours(4));
            }
            case HIGH -> {
                incident.setSlaResponseTarget(now.plusHours(2));
                incident.setSlaResolutionTarget(now.plusHours(8));
            }
            case MEDIUM -> {
                incident.setSlaResponseTarget(now.plusHours(4));
                incident.setSlaResolutionTarget(now.plusHours(24));
            }
            case LOW -> {
                incident.setSlaResponseTarget(now.plusHours(8));
                incident.setSlaResolutionTarget(now.plusHours(72));
            }
        }
    }

    private UUID resolveTenantId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
            String tid = jwt.getClaimAsString("tenant_id");
            if (tid != null) return UUID.fromString(tid);
        }
        return UUID.fromString("00000000-0000-0000-0000-000000000001");
    }

    private UUID resolveCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
            String sub = jwt.getSubject();
            if (sub != null) return UUID.nameUUIDFromBytes(sub.getBytes());
        }
        return null;
    }

    private String resolveCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "system";
    }

    private IncidentResponse mapToResponse(Incident incident) {
        return IncidentResponse.builder()
                .id(incident.getId())
                .title(incident.getTitle())
                .description(incident.getDescription())
                .priority(incident.getPriority())
                .impact(incident.getImpact())
                .urgency(incident.getUrgency())
                .status(incident.getStatus())
                .category(incident.getCategory())
                .subcategory(incident.getSubcategory())
                .serviceId(incident.getServiceId())
                .ciId(incident.getCiId())
                .assigneeId(incident.getAssigneeId())
                .assigneeGroupId(incident.getAssigneeGroupId())
                .reporterId(incident.getReporterId())
                .resolvedBy(incident.getResolvedBy())
                .closedBy(incident.getClosedBy())
                .escalationLevel(incident.getEscalationLevel())
                .resolution(incident.getResolution())
                .resolutionCode(incident.getResolutionCode())
                .closureCode(incident.getClosureCode())
                .resolvedAt(incident.getResolvedAt())
                .closedAt(incident.getClosedAt())
                .slaResponseTarget(incident.getSlaResponseTarget())
                .slaResolutionTarget(incident.getSlaResolutionTarget())
                .acknowledgedAt(incident.getAcknowledgedAt())
                .parentIncidentId(incident.getParentIncidentId())
                .tenantId(incident.getTenantId())
                .createdBy(incident.getCreatedBy())
                .createdAt(incident.getCreatedAt())
                .updatedAt(incident.getUpdatedAt())
                .build();
    }
}
