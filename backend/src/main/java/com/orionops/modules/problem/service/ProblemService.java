package com.orionops.modules.problem.service;

import com.orionops.common.exception.BusinessRuleException;
import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.modules.problem.dto.ProblemRequest;
import com.orionops.modules.problem.dto.ProblemResponse;
import com.orionops.modules.problem.entity.Problem;
import com.orionops.modules.problem.repository.ProblemRepository;
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

/**
 * Service for problem management operations.
 * Handles CRUD and problem-specific lifecycle operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProblemService {

    private final ProblemRepository problemRepository;

    @Transactional
    public ProblemResponse createProblem(ProblemRequest request) {
        Problem problem = Problem.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(request.getPriority() != null ? request.getPriority() : Problem.ProblemPriority.MEDIUM)
                .category(request.getCategory())
                .assigneeId(request.getAssigneeId())
                .serviceId(request.getServiceId())
                .relatedIncidentId(request.getRelatedIncidentId())
                .workaround(request.getWorkaround())
                .tenantId(resolveTenantId())
                .build();

        return mapToResponse(problemRepository.save(problem));
    }

    @Transactional(readOnly = true)
    public ProblemResponse getProblem(UUID id) {
        return mapToResponse(findProblemOrThrow(id));
    }

    @Transactional(readOnly = true)
    public Page<ProblemResponse> listProblems(Problem.ProblemStatus status, String search,
                                               int page, int size, String sort, String direction) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(direction), sort));
        return problemRepository.searchProblems(resolveTenantId(), status, null,
                search != null ? search : "", pageable).map(this::mapToResponse);
    }

    @Transactional
    public ProblemResponse updateProblem(UUID id, ProblemRequest request) {
        Problem problem = findProblemOrThrow(id);
        if (request.getTitle() != null) problem.setTitle(request.getTitle());
        if (request.getDescription() != null) problem.setDescription(request.getDescription());
        if (request.getPriority() != null) problem.setPriority(request.getPriority());
        if (request.getCategory() != null) problem.setCategory(request.getCategory());
        if (request.getAssigneeId() != null) problem.setAssigneeId(request.getAssigneeId());
        if (request.getServiceId() != null) problem.setServiceId(request.getServiceId());
        if (request.getWorkaround() != null) problem.setWorkaround(request.getWorkaround());
        return mapToResponse(problemRepository.save(problem));
    }

    @Transactional
    public ProblemResponse linkIncident(UUID id, UUID incidentId) {
        Problem problem = findProblemOrThrow(id);
        problem.setRelatedIncidentId(incidentId);
        return mapToResponse(problemRepository.save(problem));
    }

    @Transactional
    public ProblemResponse setRootCause(UUID id, String rootCause) {
        Problem problem = findProblemOrThrow(id);
        problem.setRootCause(rootCause);
        problem.setStatus(Problem.ProblemStatus.ROOT_CAUSE_IDENTIFIED);
        return mapToResponse(problemRepository.save(problem));
    }

    @Transactional
    public void deleteProblem(UUID id) {
        Problem problem = findProblemOrThrow(id);
        problem.softDelete();
        problemRepository.save(problem);
    }

    private Problem findProblemOrThrow(UUID id) {
        return problemRepository.findById(id)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Problem", id));
    }

    private UUID resolveTenantId() {
        return UUID.fromString("00000000-0000-0000-0000-000000000001");
    }

    private ProblemResponse mapToResponse(Problem p) {
        return ProblemResponse.builder()
                .id(p.getId()).title(p.getTitle()).description(p.getDescription())
                .priority(p.getPriority()).status(p.getStatus()).category(p.getCategory())
                .rootCause(p.getRootCause()).workaround(p.getWorkaround())
                .assigneeId(p.getAssigneeId()).serviceId(p.getServiceId())
                .relatedIncidentId(p.getRelatedIncidentId()).resolvedBy(p.getResolvedBy())
                .resolvedAt(p.getResolvedAt()).closedAt(p.getClosedAt())
                .tenantId(p.getTenantId()).createdBy(p.getCreatedBy())
                .createdAt(p.getCreatedAt()).updatedAt(p.getUpdatedAt()).build();
    }
}
