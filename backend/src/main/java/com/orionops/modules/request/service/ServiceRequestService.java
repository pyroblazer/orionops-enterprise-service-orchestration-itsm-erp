package com.orionops.modules.request.service;

import com.orionops.common.exception.BusinessRuleException;
import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.modules.request.dto.ServiceRequestDTO;
import com.orionops.modules.request.dto.ServiceRequestResponse;
import com.orionops.modules.request.entity.ServiceRequest;
import com.orionops.modules.request.repository.ServiceRequestRepository;
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
public class ServiceRequestService {

    private final ServiceRequestRepository serviceRequestRepository;

    @Transactional
    public ServiceRequestResponse createRequest(ServiceRequestDTO request) {
        ServiceRequest sr = ServiceRequest.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .assigneeId(request.getAssigneeId())
                .serviceId(request.getServiceId())
                .status(ServiceRequest.RequestStatus.DRAFT)
                .build();
        sr.setTenantId(resolveTenantId());
        return mapToResponse(serviceRequestRepository.save(sr));
    }

    @Transactional(readOnly = true)
    public ServiceRequestResponse getRequest(UUID id) {
        return mapToResponse(findRequestOrThrow(id));
    }

    @Transactional(readOnly = true)
    public Page<ServiceRequestResponse> listRequests(ServiceRequest.RequestStatus status, String search,
                                                      int page, int size, String sort, String direction) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(direction), sort));
        return serviceRequestRepository.searchRequests(resolveTenantId(), status,
                search != null ? search : "", pageable).map(this::mapToResponse);
    }

    @Transactional
    public ServiceRequestResponse updateRequest(UUID id, ServiceRequestDTO request) {
        ServiceRequest sr = findRequestOrThrow(id);
        if (sr.getStatus() != ServiceRequest.RequestStatus.DRAFT) {
            throw new BusinessRuleException("Only draft requests can be edited");
        }
        if (request.getTitle() != null) sr.setTitle(request.getTitle());
        if (request.getDescription() != null) sr.setDescription(request.getDescription());
        if (request.getCategory() != null) sr.setCategory(request.getCategory());
        if (request.getAssigneeId() != null) sr.setAssigneeId(request.getAssigneeId());
        if (request.getServiceId() != null) sr.setServiceId(request.getServiceId());
        return mapToResponse(serviceRequestRepository.save(sr));
    }

    @Transactional
    public ServiceRequestResponse submitRequest(UUID id) {
        ServiceRequest sr = findRequestOrThrow(id);
        if (sr.getStatus() != ServiceRequest.RequestStatus.DRAFT) {
            throw new BusinessRuleException("Only draft requests can be submitted");
        }
        sr.setStatus(ServiceRequest.RequestStatus.SUBMITTED);
        sr.setSubmittedAt(LocalDateTime.now());
        return mapToResponse(serviceRequestRepository.save(sr));
    }

    @Transactional
    public ServiceRequestResponse approveRequest(UUID id, UUID approverId) {
        ServiceRequest sr = findRequestOrThrow(id);
        if (sr.getStatus() != ServiceRequest.RequestStatus.SUBMITTED) {
            throw new BusinessRuleException("Only submitted requests can be approved");
        }
        sr.setStatus(ServiceRequest.RequestStatus.APPROVED);
        sr.setApproverId(approverId);
        sr.setApprovedAt(LocalDateTime.now());
        return mapToResponse(serviceRequestRepository.save(sr));
    }

    @Transactional
    public ServiceRequestResponse fulfillRequest(UUID id, String notes) {
        ServiceRequest sr = findRequestOrThrow(id);
        if (sr.getStatus() != ServiceRequest.RequestStatus.APPROVED && sr.getStatus() != ServiceRequest.RequestStatus.IN_FULFILLMENT) {
            throw new BusinessRuleException("Only approved or in-fulfillment requests can be fulfilled");
        }
        sr.setStatus(ServiceRequest.RequestStatus.FULFILLED);
        sr.setFulfillmentNotes(notes);
        sr.setFulfilledAt(LocalDateTime.now());
        return mapToResponse(serviceRequestRepository.save(sr));
    }

    @Transactional
    public ServiceRequestResponse closeRequest(UUID id) {
        ServiceRequest sr = findRequestOrThrow(id);
        if (sr.getStatus() != ServiceRequest.RequestStatus.FULFILLED) {
            throw new BusinessRuleException("Only fulfilled requests can be closed");
        }
        sr.setStatus(ServiceRequest.RequestStatus.CLOSED);
        sr.setClosedAt(LocalDateTime.now());
        return mapToResponse(serviceRequestRepository.save(sr));
    }

    @Transactional
    public void deleteRequest(UUID id) {
        ServiceRequest sr = findRequestOrThrow(id);
        sr.softDelete();
        serviceRequestRepository.save(sr);
    }

    private ServiceRequest findRequestOrThrow(UUID id) {
        return serviceRequestRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("ServiceRequest", id));
    }

    private UUID resolveTenantId() {
        return UUID.fromString("00000000-0000-0000-0000-000000000001");
    }

    private ServiceRequestResponse mapToResponse(ServiceRequest sr) {
        return ServiceRequestResponse.builder()
                .id(sr.getId()).title(sr.getTitle()).description(sr.getDescription())
                .status(sr.getStatus()).category(sr.getCategory()).requesterId(sr.getRequesterId())
                .assigneeId(sr.getAssigneeId()).approverId(sr.getApproverId()).serviceId(sr.getServiceId())
                .fulfillmentNotes(sr.getFulfillmentNotes()).submittedAt(sr.getSubmittedAt())
                .approvedAt(sr.getApprovedAt()).fulfilledAt(sr.getFulfilledAt()).closedAt(sr.getClosedAt())
                .tenantId(sr.getTenantId()).createdBy(sr.getCreatedBy())
                .createdAt(sr.getCreatedAt()).updatedAt(sr.getUpdatedAt()).build();
    }
}
