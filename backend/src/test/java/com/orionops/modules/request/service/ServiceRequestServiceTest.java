package com.orionops.modules.request.service;

import com.orionops.common.exception.BusinessRuleException;
import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.common.tenant.TenantContextHolder;
import com.orionops.modules.request.dto.ServiceRequestDTO;
import com.orionops.modules.request.dto.ServiceRequestResponse;
import com.orionops.modules.request.entity.ServiceRequest;
import com.orionops.modules.request.repository.ServiceRequestRepository;
import org.junit.jupiter.api.AfterEach;
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
 * Unit tests for {@link ServiceRequestService}.
 * Covers CRUD, state machine (DRAFT → SUBMITTED → APPROVED → FULFILLED → CLOSED), and validation.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ServiceRequestService")
class ServiceRequestServiceTest {

    @Mock
    private ServiceRequestRepository serviceRequestRepository;

    @InjectMocks
    private ServiceRequestService serviceRequestService;

    private UUID tenantId;
    private UUID requesterId;
    private UUID assigneeId;
    private UUID approverId;
    private UUID serviceId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        requesterId = UUID.fromString("00000000-0000-0000-0000-000000000002");
        assigneeId = UUID.fromString("00000000-0000-0000-0000-000000000003");
        approverId = UUID.fromString("00000000-0000-0000-0000-000000000004");
        serviceId = UUID.fromString("00000000-0000-0000-0000-000000000005");
        TenantContextHolder.setCurrentTenantId(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private ServiceRequestDTO buildRequest(String title, String description) {
        ServiceRequestDTO req = new ServiceRequestDTO();
        req.setTitle(title);
        req.setDescription(description);
        req.setCategory("Access Request");
        req.setAssigneeId(assigneeId);
        req.setServiceId(serviceId);
        return req;
    }

    private ServiceRequest buildServiceRequest(UUID id, String title, ServiceRequest.RequestStatus status) {
        ServiceRequest sr = ServiceRequest.builder()
                .title(title)
                .description("Detailed description for " + title)
                .category("Access Request")
                .assigneeId(assigneeId)
                .requesterId(requesterId)
                .serviceId(serviceId)
                .status(status)
                .build();
        sr.setId(id);
        sr.setTenantId(tenantId);
        return sr;
    }

    // ========================================================================
    // CREATE REQUEST
    // ========================================================================

    @Nested
    @DisplayName("createRequest")
    class CreateRequest {

        @Test
        @DisplayName("creates request with DRAFT status")
        void createsDraftRequest() {
            ServiceRequestDTO req = buildRequest("Access to prod", "Need database access");

            when(serviceRequestRepository.save(any(ServiceRequest.class)))
                    .thenAnswer(invocation -> {
                        ServiceRequest sr = invocation.getArgument(0);
                        sr.setId(UUID.randomUUID());
                        return sr;
                    });

            ServiceRequestResponse response = serviceRequestService.createRequest(req);

            ArgumentCaptor<ServiceRequest> captor = ArgumentCaptor.forClass(ServiceRequest.class);
            verify(serviceRequestRepository).save(captor.capture());
            assertThat(captor.getValue().getStatus()).isEqualTo(ServiceRequest.RequestStatus.DRAFT);
        }

        @Test
        @DisplayName("sets tenantId from context")
        void setsTenantId() {
            ServiceRequestDTO req = buildRequest("Access", "Need access");

            when(serviceRequestRepository.save(any(ServiceRequest.class)))
                    .thenAnswer(invocation -> {
                        ServiceRequest sr = invocation.getArgument(0);
                        sr.setId(UUID.randomUUID());
                        return sr;
                    });

            serviceRequestService.createRequest(req);

            ArgumentCaptor<ServiceRequest> captor = ArgumentCaptor.forClass(ServiceRequest.class);
            verify(serviceRequestRepository).save(captor.capture());
            assertThat(captor.getValue().getTenantId()).isEqualTo(tenantId);
        }
    }

    // ========================================================================
    // GET REQUEST
    // ========================================================================

    @Nested
    @DisplayName("getRequest")
    class GetRequest {

        @Test
        @DisplayName("returns request for valid ID")
        void returnsRequest() {
            UUID id = UUID.randomUUID();
            ServiceRequest sr = buildServiceRequest(id, "Access Request", ServiceRequest.RequestStatus.SUBMITTED);
            when(serviceRequestRepository.findById(id)).thenReturn(Optional.of(sr));

            ServiceRequestResponse response = serviceRequestService.getRequest(id);

            assertThat(response.getTitle()).isEqualTo("Access Request");
            assertThat(response.getStatus()).isEqualTo(ServiceRequest.RequestStatus.SUBMITTED);
        }

        @Test
        @DisplayName("throws ResourceNotFoundException for missing request")
        void throwsForMissing() {
            UUID id = UUID.randomUUID();
            when(serviceRequestRepository.findById(id)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> serviceRequestService.getRequest(id))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("throws ResourceNotFoundException for soft-deleted request")
        void throwsForSoftDeleted() {
            UUID id = UUID.randomUUID();
            ServiceRequest sr = buildServiceRequest(id, "Deleted", ServiceRequest.RequestStatus.DRAFT);
            sr.softDelete();
            when(serviceRequestRepository.findById(id)).thenReturn(Optional.of(sr));

            assertThatThrownBy(() -> serviceRequestService.getRequest(id))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ========================================================================
    // UPDATE REQUEST
    // ========================================================================

    @Nested
    @DisplayName("updateRequest")
    class UpdateRequest {

        @Test
        @DisplayName("DRAFT request: updates fields")
        void draftRequest_updatesFields() {
            UUID id = UUID.randomUUID();
            ServiceRequest sr = buildServiceRequest(id, "Old Title", ServiceRequest.RequestStatus.DRAFT);
            when(serviceRequestRepository.findById(id)).thenReturn(Optional.of(sr));
            when(serviceRequestRepository.save(any(ServiceRequest.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            ServiceRequestDTO req = new ServiceRequestDTO();
            req.setTitle("New Title");
            req.setDescription("Updated description");

            ServiceRequestResponse response = serviceRequestService.updateRequest(id, req);

            assertThat(response.getTitle()).isEqualTo("New Title");
            assertThat(response.getDescription()).isEqualTo("Updated description");
        }

        @Test
        @DisplayName("non-DRAFT request: throws BusinessRuleException")
        void nonDraft_throwsException() {
            UUID id = UUID.randomUUID();
            ServiceRequest sr = buildServiceRequest(id, "Request", ServiceRequest.RequestStatus.SUBMITTED);
            when(serviceRequestRepository.findById(id)).thenReturn(Optional.of(sr));

            ServiceRequestDTO req = new ServiceRequestDTO();
            req.setTitle("New Title");

            assertThatThrownBy(() -> serviceRequestService.updateRequest(id, req))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("Only draft requests can be edited");
        }
    }

    // ========================================================================
    // SUBMIT REQUEST
    // ========================================================================

    @Nested
    @DisplayName("submitRequest")
    class SubmitRequest {

        @Test
        @DisplayName("DRAFT → SUBMITTED with submittedAt timestamp")
        void draftToSubmitted() {
            UUID id = UUID.randomUUID();
            ServiceRequest sr = buildServiceRequest(id, "Request", ServiceRequest.RequestStatus.DRAFT);
            when(serviceRequestRepository.findById(id)).thenReturn(Optional.of(sr));
            when(serviceRequestRepository.save(any(ServiceRequest.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            ServiceRequestResponse response = serviceRequestService.submitRequest(id);

            assertThat(response.getStatus()).isEqualTo(ServiceRequest.RequestStatus.SUBMITTED);
            assertThat(response.getSubmittedAt()).isNotNull();
        }

        @Test
        @DisplayName("non-DRAFT request: throws BusinessRuleException")
        void nonDraft_throwsException() {
            UUID id = UUID.randomUUID();
            ServiceRequest sr = buildServiceRequest(id, "Request", ServiceRequest.RequestStatus.APPROVED);
            when(serviceRequestRepository.findById(id)).thenReturn(Optional.of(sr));

            assertThatThrownBy(() -> serviceRequestService.submitRequest(id))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("Only draft requests can be submitted");
        }
    }

    // ========================================================================
    // APPROVE REQUEST
    // ========================================================================

    @Nested
    @DisplayName("approveRequest")
    class ApproveRequest {

        @Test
        @DisplayName("SUBMITTED → APPROVED with approverId and approvedAt")
        void submittedToApproved() {
            UUID id = UUID.randomUUID();
            ServiceRequest sr = buildServiceRequest(id, "Request", ServiceRequest.RequestStatus.SUBMITTED);
            when(serviceRequestRepository.findById(id)).thenReturn(Optional.of(sr));
            when(serviceRequestRepository.save(any(ServiceRequest.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            ServiceRequestResponse response = serviceRequestService.approveRequest(id, approverId);

            assertThat(response.getStatus()).isEqualTo(ServiceRequest.RequestStatus.APPROVED);
            assertThat(response.getApproverId()).isEqualTo(approverId);
            assertThat(response.getApprovedAt()).isNotNull();
        }

        @Test
        @DisplayName("non-SUBMITTED request: throws BusinessRuleException")
        void nonSubmitted_throwsException() {
            UUID id = UUID.randomUUID();
            ServiceRequest sr = buildServiceRequest(id, "Request", ServiceRequest.RequestStatus.DRAFT);
            when(serviceRequestRepository.findById(id)).thenReturn(Optional.of(sr));

            assertThatThrownBy(() -> serviceRequestService.approveRequest(id, approverId))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("Only submitted requests can be approved");
        }
    }

    // ========================================================================
    // FULFILL REQUEST
    // ========================================================================

    @Nested
    @DisplayName("fulfillRequest")
    class FulfillRequest {

        @Test
        @DisplayName("APPROVED → FULFILLED with fulfillmentNotes and fulfilledAt")
        void approvedToFulfilled() {
            UUID id = UUID.randomUUID();
            ServiceRequest sr = buildServiceRequest(id, "Request", ServiceRequest.RequestStatus.APPROVED);
            when(serviceRequestRepository.findById(id)).thenReturn(Optional.of(sr));
            when(serviceRequestRepository.save(any(ServiceRequest.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            ServiceRequestResponse response = serviceRequestService.fulfillRequest(id, "Access granted successfully");

            assertThat(response.getStatus()).isEqualTo(ServiceRequest.RequestStatus.FULFILLED);
            assertThat(response.getFulfillmentNotes()).isEqualTo("Access granted successfully");
            assertThat(response.getFulfilledAt()).isNotNull();
        }

        @Test
        @DisplayName("IN_FULFILLMENT → FULFILLED also allowed")
        void inFulfillmentToFulfilled() {
            UUID id = UUID.randomUUID();
            ServiceRequest sr = buildServiceRequest(id, "Request", ServiceRequest.RequestStatus.IN_FULFILLMENT);
            when(serviceRequestRepository.findById(id)).thenReturn(Optional.of(sr));
            when(serviceRequestRepository.save(any(ServiceRequest.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            ServiceRequestResponse response = serviceRequestService.fulfillRequest(id, "Completed");

            assertThat(response.getStatus()).isEqualTo(ServiceRequest.RequestStatus.FULFILLED);
        }

        @Test
        @DisplayName("non-APPROVED/IN_FULFILLMENT request: throws BusinessRuleException")
        void nonApprovedOrInFulfillment_throwsException() {
            UUID id = UUID.randomUUID();
            ServiceRequest sr = buildServiceRequest(id, "Request", ServiceRequest.RequestStatus.DRAFT);
            when(serviceRequestRepository.findById(id)).thenReturn(Optional.of(sr));

            assertThatThrownBy(() -> serviceRequestService.fulfillRequest(id, "Notes"))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("Only approved or in-fulfillment requests can be fulfilled");
        }
    }

    // ========================================================================
    // CLOSE REQUEST
    // ========================================================================

    @Nested
    @DisplayName("closeRequest")
    class CloseRequest {

        @Test
        @DisplayName("FULFILLED → CLOSED with closedAt timestamp")
        void fulfilledToClosed() {
            UUID id = UUID.randomUUID();
            ServiceRequest sr = buildServiceRequest(id, "Request", ServiceRequest.RequestStatus.FULFILLED);
            when(serviceRequestRepository.findById(id)).thenReturn(Optional.of(sr));
            when(serviceRequestRepository.save(any(ServiceRequest.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            ServiceRequestResponse response = serviceRequestService.closeRequest(id);

            assertThat(response.getStatus()).isEqualTo(ServiceRequest.RequestStatus.CLOSED);
            assertThat(response.getClosedAt()).isNotNull();
        }

        @Test
        @DisplayName("non-FULFILLED request: throws BusinessRuleException")
        void nonFulfilled_throwsException() {
            UUID id = UUID.randomUUID();
            ServiceRequest sr = buildServiceRequest(id, "Request", ServiceRequest.RequestStatus.APPROVED);
            when(serviceRequestRepository.findById(id)).thenReturn(Optional.of(sr));

            assertThatThrownBy(() -> serviceRequestService.closeRequest(id))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("Only fulfilled requests can be closed");
        }
    }

    // ========================================================================
    // DELETE REQUEST
    // ========================================================================

    @Nested
    @DisplayName("deleteRequest")
    class DeleteRequest {

        @Test
        @DisplayName("soft deletes request by setting deletedAt")
        void softDeletesRequest() {
            UUID id = UUID.randomUUID();
            ServiceRequest sr = buildServiceRequest(id, "To Delete", ServiceRequest.RequestStatus.DRAFT);
            when(serviceRequestRepository.findById(id)).thenReturn(Optional.of(sr));
            when(serviceRequestRepository.save(any(ServiceRequest.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            serviceRequestService.deleteRequest(id);

            ArgumentCaptor<ServiceRequest> captor = ArgumentCaptor.forClass(ServiceRequest.class);
            verify(serviceRequestRepository).save(captor.capture());
            assertThat(captor.getValue().isDeleted()).isTrue();
        }
    }

    // ========================================================================
    // STATE MACHINE FULL LIFECYCLE
    // ========================================================================

    @Nested
    @DisplayName("state machine full lifecycle")
    class StateMachineFullLifecycle {

        @Test
        @DisplayName("DRAFT → SUBMITTED → APPROVED → FULFILLED → CLOSED")
        void fullLifecycle() {
            UUID id = UUID.randomUUID();
            ServiceRequest sr = buildServiceRequest(id, "Complete Request", ServiceRequest.RequestStatus.DRAFT);
            when(serviceRequestRepository.findById(id)).thenReturn(Optional.of(sr));
            when(serviceRequestRepository.save(any(ServiceRequest.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            // Step 1: Submit (DRAFT → SUBMITTED)
            ServiceRequestResponse step1 = serviceRequestService.submitRequest(id);
            assertThat(step1.getStatus()).isEqualTo(ServiceRequest.RequestStatus.SUBMITTED);
            sr.setStatus(ServiceRequest.RequestStatus.SUBMITTED);

            // Step 2: Approve (SUBMITTED → APPROVED)
            ServiceRequestResponse step2 = serviceRequestService.approveRequest(id, approverId);
            assertThat(step2.getStatus()).isEqualTo(ServiceRequest.RequestStatus.APPROVED);
            sr.setStatus(ServiceRequest.RequestStatus.APPROVED);

            // Step 3: Fulfill (APPROVED → FULFILLED)
            ServiceRequestResponse step3 = serviceRequestService.fulfillRequest(id, "All done");
            assertThat(step3.getStatus()).isEqualTo(ServiceRequest.RequestStatus.FULFILLED);
            sr.setStatus(ServiceRequest.RequestStatus.FULFILLED);

            // Step 4: Close (FULFILLED → CLOSED)
            ServiceRequestResponse step4 = serviceRequestService.closeRequest(id);
            assertThat(step4.getStatus()).isEqualTo(ServiceRequest.RequestStatus.CLOSED);
        }
    }
}
