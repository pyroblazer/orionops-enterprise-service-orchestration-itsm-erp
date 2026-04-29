package com.orionops.modules.change.service;

import com.orionops.common.event.EventPublisher;
import com.orionops.common.exception.BusinessRuleException;
import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.modules.change.dto.ChangeRequestDTO;
import com.orionops.modules.change.dto.ChangeResponse;
import com.orionops.modules.change.entity.ChangeRequest;
import com.orionops.modules.change.event.ChangeApprovedEvent;
import com.orionops.modules.change.event.ChangeImplementedEvent;
import com.orionops.modules.change.event.ChangeRejectedEvent;
import com.orionops.modules.change.event.ChangeSubmittedEvent;
import com.orionops.modules.change.repository.ChangeRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChangeService {

    private final ChangeRequestRepository changeRequestRepository;
    private final EventPublisher eventPublisher;

    @Transactional
    public ChangeResponse createChange(ChangeRequestDTO request) {
        ChangeRequest change = ChangeRequest.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .changeType(request.getChangeType() != null ? request.getChangeType() : ChangeRequest.ChangeType.STANDARD)
                .risk(request.getRisk() != null ? request.getRisk() : ChangeRequest.ChangeRisk.MEDIUM)
                .impact(request.getImpact() != null ? request.getImpact() : ChangeRequest.ChangeImpact.MODERATE)
                .status(ChangeRequest.ChangeStatus.DRAFT)
                .category(request.getCategory())
                .assigneeId(request.getAssigneeId())
                .serviceId(request.getServiceId())
                .implementationPlan(request.getImplementationPlan())
                .rollbackPlan(request.getRollbackPlan())
                .testPlan(request.getTestPlan())
                .plannedStart(request.getPlannedStart())
                .plannedEnd(request.getPlannedEnd())
                .tenantId(resolveTenantId())
                .build();
        return mapToResponse(changeRequestRepository.save(change));
    }

    @Transactional(readOnly = true)
    public ChangeResponse getChange(UUID id) {
        return mapToResponse(findChangeOrThrow(id));
    }

    @Transactional(readOnly = true)
    public Page<ChangeResponse> listChanges(ChangeRequest.ChangeStatus status, ChangeRequest.ChangeType changeType,
                                             String search, int page, int size, String sort, String direction) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(direction), sort));
        return changeRequestRepository.searchChanges(resolveTenantId(), status, changeType,
                search != null ? search : "", pageable).map(this::mapToResponse);
    }

    @Transactional
    public ChangeResponse updateChange(UUID id, ChangeRequestDTO request) {
        ChangeRequest change = findChangeOrThrow(id);
        if (change.getStatus() != ChangeRequest.ChangeStatus.DRAFT) {
            throw new BusinessRuleException("Only draft changes can be edited");
        }
        if (request.getTitle() != null) change.setTitle(request.getTitle());
        if (request.getDescription() != null) change.setDescription(request.getDescription());
        if (request.getChangeType() != null) change.setChangeType(request.getChangeType());
        if (request.getRisk() != null) change.setRisk(request.getRisk());
        if (request.getImpact() != null) change.setImpact(request.getImpact());
        if (request.getCategory() != null) change.setCategory(request.getCategory());
        if (request.getAssigneeId() != null) change.setAssigneeId(request.getAssigneeId());
        if (request.getServiceId() != null) change.setServiceId(request.getServiceId());
        if (request.getImplementationPlan() != null) change.setImplementationPlan(request.getImplementationPlan());
        if (request.getRollbackPlan() != null) change.setRollbackPlan(request.getRollbackPlan());
        if (request.getTestPlan() != null) change.setTestPlan(request.getTestPlan());
        if (request.getPlannedStart() != null) change.setPlannedStart(request.getPlannedStart());
        if (request.getPlannedEnd() != null) change.setPlannedEnd(request.getPlannedEnd());
        return mapToResponse(changeRequestRepository.save(change));
    }

    @Transactional
    public ChangeResponse submitChange(UUID id) {
        ChangeRequest change = findChangeOrThrow(id);
        if (change.getStatus() != ChangeRequest.ChangeStatus.DRAFT) {
            throw new BusinessRuleException("Only draft changes can be submitted");
        }
        change.setStatus(ChangeRequest.ChangeStatus.SUBMITTED);
        ChangeRequest saved = changeRequestRepository.save(change);
        eventPublisher.publish(ChangeSubmittedEvent.builder()
                .aggregateId(saved.getId()).changeId(saved.getId())
                .changeType(saved.getChangeType().name())
                .requesterId(saved.getRequesterId())
                .approverId(saved.getApproverId()).build());
        return mapToResponse(saved);
    }

    @Transactional
    public ChangeResponse approveChange(UUID id, UUID approverId) {
        ChangeRequest change = findChangeOrThrow(id);
        if (change.getStatus() != ChangeRequest.ChangeStatus.SUBMITTED) {
            throw new BusinessRuleException("Only submitted changes can be approved");
        }
        change.setStatus(ChangeRequest.ChangeStatus.APPROVED);
        change.setApproverId(approverId);
        change.setApprovedAt(LocalDateTime.now());
        ChangeRequest saved = changeRequestRepository.save(change);
        eventPublisher.publish(ChangeApprovedEvent.builder()
                .aggregateId(saved.getId()).changeId(saved.getId()).approvedBy(approverId).build());
        return mapToResponse(saved);
    }

    @Transactional
    public ChangeResponse rejectChange(UUID id, String reason) {
        ChangeRequest change = findChangeOrThrow(id);
        if (change.getStatus() != ChangeRequest.ChangeStatus.SUBMITTED) {
            throw new BusinessRuleException("Only submitted changes can be rejected");
        }
        change.setStatus(ChangeRequest.ChangeStatus.REJECTED);
        change.setRejectionReason(reason);
        ChangeRequest saved = changeRequestRepository.save(change);
        eventPublisher.publish(ChangeRejectedEvent.builder()
                .aggregateId(saved.getId()).changeId(saved.getId())
                .rejectedBy(null).rejectionReason(reason).build());
        return mapToResponse(saved);
    }

    @Transactional
    public ChangeResponse implementChange(UUID id, String notes) {
        ChangeRequest change = findChangeOrThrow(id);
        if (change.getStatus() != ChangeRequest.ChangeStatus.APPROVED) {
            throw new BusinessRuleException("Only approved changes can be implemented");
        }
        change.setStatus(ChangeRequest.ChangeStatus.IMPLEMENTING);
        change.setImplementationNotes(notes);
        change.setImplementedAt(LocalDateTime.now());
        ChangeRequest saved = changeRequestRepository.save(change);
        eventPublisher.publish(ChangeImplementedEvent.builder()
                .aggregateId(saved.getId()).changeId(saved.getId())
                .implementedBy(null).implementationNotes(notes).build());
        return mapToResponse(saved);
    }

    @Transactional
    public ChangeResponse closeChange(UUID id) {
        ChangeRequest change = findChangeOrThrow(id);
        if (change.getStatus() != ChangeRequest.ChangeStatus.IMPLEMENTING && change.getStatus() != ChangeRequest.ChangeStatus.COMPLETED) {
            throw new BusinessRuleException("Only implemented or completed changes can be closed");
        }
        change.setStatus(ChangeRequest.ChangeStatus.CLOSED);
        change.setClosedAt(LocalDateTime.now());
        return mapToResponse(changeRequestRepository.save(change));
    }

    @Transactional
    public void deleteChange(UUID id) {
        ChangeRequest change = findChangeOrThrow(id);
        if (change.getStatus() != ChangeRequest.ChangeStatus.DRAFT && change.getStatus() != ChangeRequest.ChangeStatus.CANCELLED) {
            throw new BusinessRuleException("Only draft or cancelled changes can be deleted");
        }
        change.softDelete();
        changeRequestRepository.save(change);
    }

    private ChangeRequest findChangeOrThrow(UUID id) {
        return changeRequestRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("ChangeRequest", id));
    }

    private UUID resolveTenantId() {
        return UUID.fromString("00000000-0000-0000-0000-000000000001");
    }

    private ChangeResponse mapToResponse(ChangeRequest c) {
        return ChangeResponse.builder()
                .id(c.getId()).title(c.getTitle()).description(c.getDescription())
                .changeType(c.getChangeType()).status(c.getStatus()).risk(c.getRisk()).impact(c.getImpact())
                .category(c.getCategory()).requesterId(c.getRequesterId()).assigneeId(c.getAssigneeId())
                .approverId(c.getApproverId()).serviceId(c.getServiceId())
                .implementationPlan(c.getImplementationPlan()).rollbackPlan(c.getRollbackPlan())
                .testPlan(c.getTestPlan()).plannedStart(c.getPlannedStart()).plannedEnd(c.getPlannedEnd())
                .implementedAt(c.getImplementedAt()).approvedAt(c.getApprovedAt()).closedAt(c.getClosedAt())
                .rejectionReason(c.getRejectionReason()).implementationNotes(c.getImplementationNotes())
                .tenantId(c.getTenantId()).createdBy(c.getCreatedBy())
                .createdAt(c.getCreatedAt()).updatedAt(c.getUpdatedAt()).build();
    }
}
