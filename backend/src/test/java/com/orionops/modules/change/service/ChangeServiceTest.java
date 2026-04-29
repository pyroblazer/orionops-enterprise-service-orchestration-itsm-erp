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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link ChangeService}.
 * Covers the full change lifecycle: create, submit, approve/reject, implement, close.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ChangeService")
class ChangeServiceTest {

    @Mock
    private ChangeRequestRepository changeRequestRepository;

    @Mock
    private EventPublisher eventPublisher;

    @InjectMocks
    private ChangeService changeService;

    private ChangeRequest testChange;
    private UUID tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        testChange = buildTestChange();
    }

    private ChangeRequest buildTestChange() {
        ChangeRequest cr = ChangeRequest.builder()
                .title("Upgrade database to v15")
                .description("Major version upgrade of production database")
                .changeType(ChangeRequest.ChangeType.NORMAL)
                .risk(ChangeRequest.ChangeRisk.MEDIUM)
                .impact(ChangeRequest.ChangeImpact.MODERATE)
                .status(ChangeRequest.ChangeStatus.DRAFT)
                .category("Database")
                .implementationPlan("Stop app, upgrade DB, run migrations, restart")
                .rollbackPlan("Restore from snapshot")
                .testPlan("Run integration test suite")
                .plannedStart(LocalDateTime.now().plusDays(7))
                .plannedEnd(LocalDateTime.now().plusDays(7).plusHours(4))
                .tenantId(tenantId)
                .build();
        cr.setId(UUID.randomUUID());
        cr.setCreatedAt(LocalDateTime.now());
        cr.setUpdatedAt(LocalDateTime.now());
        cr.setCreatedBy("test-user");
        return cr;
    }

    @Nested
    @DisplayName("createChange")
    class CreateChangeTests {

        @Test
        @DisplayName("should create change request in DRAFT status")
        void shouldCreateChange_whenValidRequest_givenAllFields() {
            ChangeRequestDTO request = ChangeRequestDTO.builder()
                    .title("Deploy v2.0")
                    .description("Deploy new version to production")
                    .changeType(ChangeRequest.ChangeType.STANDARD)
                    .risk(ChangeRequest.ChangeRisk.LOW)
                    .impact(ChangeRequest.ChangeImpact.MINIMAL)
                    .build();

            when(changeRequestRepository.save(any(ChangeRequest.class))).thenAnswer(invocation -> {
                ChangeRequest cr = invocation.getArgument(0);
                cr.setId(UUID.randomUUID());
                cr.setCreatedAt(LocalDateTime.now());
                cr.setUpdatedAt(LocalDateTime.now());
                return cr;
            });

            ChangeResponse response = changeService.createChange(request);

            assertThat(response).isNotNull();
            assertThat(response.getTitle()).isEqualTo("Deploy v2.0");
            assertThat(response.getStatus()).isEqualTo(ChangeRequest.ChangeStatus.DRAFT);
            assertThat(response.getChangeType()).isEqualTo(ChangeRequest.ChangeType.STANDARD);
        }
    }

    @Nested
    @DisplayName("submitChange")
    class SubmitChangeTests {

        @Test
        @DisplayName("should submit draft change and publish ChangeSubmittedEvent")
        void shouldSubmitChange_whenDraft_givenValidChange() {
            when(changeRequestRepository.findById(testChange.getId())).thenReturn(Optional.of(testChange));
            when(changeRequestRepository.save(any(ChangeRequest.class))).thenReturn(testChange);

            ChangeResponse response = changeService.submitChange(testChange.getId());

            assertThat(response).isNotNull();

            verify(changeRequestRepository).save(any(ChangeRequest.class));

            ArgumentCaptor<ChangeSubmittedEvent> eventCaptor = ArgumentCaptor.forClass(ChangeSubmittedEvent.class);
            verify(eventPublisher).publish(eventCaptor.capture());
            assertThat(eventCaptor.getValue().getChangeId()).isEqualTo(testChange.getId());
        }

        @Test
        @DisplayName("should throw BusinessRuleException when submitting non-draft change")
        void shouldThrowException_whenSubmitting_givenNonDraftStatus() {
            testChange.setStatus(ChangeRequest.ChangeStatus.APPROVED);
            when(changeRequestRepository.findById(testChange.getId())).thenReturn(Optional.of(testChange));

            assertThatThrownBy(() -> changeService.submitChange(testChange.getId()))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("Only draft");

            verify(eventPublisher, never()).publish(any());
        }
    }

    @Nested
    @DisplayName("approveChange")
    class ApproveChangeTests {

        @Test
        @DisplayName("should approve submitted change and publish ChangeApprovedEvent")
        void shouldApproveChange_whenSubmitted_givenValidApprover() {
            testChange.setStatus(ChangeRequest.ChangeStatus.SUBMITTED);
            UUID approverId = UUID.randomUUID();

            when(changeRequestRepository.findById(testChange.getId())).thenReturn(Optional.of(testChange));
            when(changeRequestRepository.save(any(ChangeRequest.class))).thenReturn(testChange);

            ChangeResponse response = changeService.approveChange(testChange.getId(), approverId);

            assertThat(response).isNotNull();

            verify(changeRequestRepository).save(any(ChangeRequest.class));

            ArgumentCaptor<ChangeApprovedEvent> eventCaptor = ArgumentCaptor.forClass(ChangeApprovedEvent.class);
            verify(eventPublisher).publish(eventCaptor.capture());
            assertThat(eventCaptor.getValue().getChangeId()).isEqualTo(testChange.getId());
            assertThat(eventCaptor.getValue().getApprovedBy()).isEqualTo(approverId);
        }

        @Test
        @DisplayName("should throw BusinessRuleException when approving non-submitted change")
        void shouldThrowException_whenApproving_givenDraftStatus() {
            testChange.setStatus(ChangeRequest.ChangeStatus.DRAFT);
            when(changeRequestRepository.findById(testChange.getId())).thenReturn(Optional.of(testChange));

            assertThatThrownBy(() -> changeService.approveChange(testChange.getId(), UUID.randomUUID()))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("Only submitted");
        }
    }

    @Nested
    @DisplayName("rejectChange")
    class RejectChangeTests {

        @Test
        @DisplayName("should reject submitted change and publish ChangeRejectedEvent")
        void shouldRejectChange_whenSubmitted_givenValidReason() {
            testChange.setStatus(ChangeRequest.ChangeStatus.SUBMITTED);

            when(changeRequestRepository.findById(testChange.getId())).thenReturn(Optional.of(testChange));
            when(changeRequestRepository.save(any(ChangeRequest.class))).thenReturn(testChange);

            ChangeResponse response = changeService.rejectChange(testChange.getId(), "Insufficient testing");

            assertThat(response).isNotNull();

            verify(changeRequestRepository).save(any(ChangeRequest.class));

            ArgumentCaptor<ChangeRejectedEvent> eventCaptor = ArgumentCaptor.forClass(ChangeRejectedEvent.class);
            verify(eventPublisher).publish(eventCaptor.capture());
            assertThat(eventCaptor.getValue().getRejectionReason()).isEqualTo("Insufficient testing");
        }
    }

    @Nested
    @DisplayName("implementChange")
    class ImplementChangeTests {

        @Test
        @DisplayName("should start implementation and publish ChangeImplementedEvent")
        void shouldImplementChange_whenApproved_givenImplementationNotes() {
            testChange.setStatus(ChangeRequest.ChangeStatus.APPROVED);

            when(changeRequestRepository.findById(testChange.getId())).thenReturn(Optional.of(testChange));
            when(changeRequestRepository.save(any(ChangeRequest.class))).thenReturn(testChange);

            ChangeResponse response = changeService.implementChange(testChange.getId(), "Migration complete");

            assertThat(response).isNotNull();

            verify(changeRequestRepository).save(any(ChangeRequest.class));

            ArgumentCaptor<ChangeImplementedEvent> eventCaptor = ArgumentCaptor.forClass(ChangeImplementedEvent.class);
            verify(eventPublisher).publish(eventCaptor.capture());
            assertThat(eventCaptor.getValue().getImplementationNotes()).isEqualTo("Migration complete");
        }

        @Test
        @DisplayName("should throw BusinessRuleException when implementing non-approved change")
        void shouldThrowException_whenImplementing_givenNonApprovedStatus() {
            testChange.setStatus(ChangeRequest.ChangeStatus.DRAFT);
            when(changeRequestRepository.findById(testChange.getId())).thenReturn(Optional.of(testChange));

            assertThatThrownBy(() -> changeService.implementChange(testChange.getId(), "notes"))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("Only approved");
        }
    }

    @Nested
    @DisplayName("closeChange")
    class CloseChangeTests {

        @Test
        @DisplayName("should close an implementing change")
        void shouldCloseChange_whenImplementing_givenValidChange() {
            testChange.setStatus(ChangeRequest.ChangeStatus.IMPLEMENTING);

            when(changeRequestRepository.findById(testChange.getId())).thenReturn(Optional.of(testChange));
            when(changeRequestRepository.save(any(ChangeRequest.class))).thenReturn(testChange);

            ChangeResponse response = changeService.closeChange(testChange.getId());

            assertThat(response).isNotNull();
            verify(changeRequestRepository).save(any(ChangeRequest.class));
        }

        @Test
        @DisplayName("should throw BusinessRuleException when closing draft change")
        void shouldThrowException_whenClosing_givenDraftStatus() {
            testChange.setStatus(ChangeRequest.ChangeStatus.DRAFT);
            when(changeRequestRepository.findById(testChange.getId())).thenReturn(Optional.of(testChange));

            assertThatThrownBy(() -> changeService.closeChange(testChange.getId()))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("Only implemented or completed");
        }
    }

    @Nested
    @DisplayName("deleteChange")
    class DeleteChangeTests {

        @Test
        @DisplayName("should soft delete a draft change")
        void shouldDeleteDraft_whenDeleting_givenDraftChange() {
            testChange.setStatus(ChangeRequest.ChangeStatus.DRAFT);
            when(changeRequestRepository.findById(testChange.getId())).thenReturn(Optional.of(testChange));
            when(changeRequestRepository.save(any(ChangeRequest.class))).thenReturn(testChange);

            changeService.deleteChange(testChange.getId());

            assertThat(testChange.isDeleted()).isTrue();
        }

        @Test
        @DisplayName("should throw BusinessRuleException when deleting approved change")
        void shouldThrowException_whenDeleting_givenApprovedChange() {
            testChange.setStatus(ChangeRequest.ChangeStatus.APPROVED);
            when(changeRequestRepository.findById(testChange.getId())).thenReturn(Optional.of(testChange));

            assertThatThrownBy(() -> changeService.deleteChange(testChange.getId()))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("Only draft or cancelled");
        }
    }

    @Nested
    @DisplayName("fullLifecycle")
    class FullLifecycleTests {

        @Test
        @DisplayName("should complete full lifecycle: create -> submit -> approve -> implement -> close")
        void shouldCompleteFullLifecycle_whenValid_givenSequentialOperations() {
            // Create
            ChangeRequestDTO createRequest = ChangeRequestDTO.builder()
                    .title("Full lifecycle test")
                    .build();
            when(changeRequestRepository.save(any(ChangeRequest.class))).thenAnswer(invocation -> {
                ChangeRequest cr = invocation.getArgument(0);
                if (cr.getId() == null) cr.setId(UUID.randomUUID());
                cr.setCreatedAt(LocalDateTime.now());
                cr.setUpdatedAt(LocalDateTime.now());
                return cr;
            });

            ChangeResponse created = changeService.createChange(createRequest);
            assertThat(created.getStatus()).isEqualTo(ChangeRequest.ChangeStatus.DRAFT);
            UUID changeId = created.getId();

            // Submit
            testChange.setId(changeId);
            testChange.setStatus(ChangeRequest.ChangeStatus.DRAFT);
            when(changeRequestRepository.findById(changeId)).thenReturn(Optional.of(testChange));

            ChangeResponse submitted = changeService.submitChange(changeId);
            verify(eventPublisher).publish(any(ChangeSubmittedEvent.class));

            // Approve
            testChange.setStatus(ChangeRequest.ChangeStatus.SUBMITTED);
            ChangeResponse approved = changeService.approveChange(changeId, UUID.randomUUID());
            verify(eventPublisher).publish(any(ChangeApprovedEvent.class));

            // Implement
            testChange.setStatus(ChangeRequest.ChangeStatus.APPROVED);
            ChangeResponse implemented = changeService.implementChange(changeId, "Done");
            verify(eventPublisher).publish(any(ChangeImplementedEvent.class));

            // Close
            testChange.setStatus(ChangeRequest.ChangeStatus.IMPLEMENTING);
            ChangeResponse closed = changeService.closeChange(changeId);
            assertThat(closed).isNotNull();
        }
    }
}
