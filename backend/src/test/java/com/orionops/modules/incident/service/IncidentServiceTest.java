package com.orionops.modules.incident.service;

import com.orionops.common.event.BaseEvent;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link IncidentService}.
 * Covers all lifecycle operations, event publishing, search, and error scenarios.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("IncidentService")
class IncidentServiceTest {

    @Mock
    private IncidentRepository incidentRepository;

    @Mock
    private EventPublisher eventPublisher;

    @InjectMocks
    private IncidentService incidentService;

    private UUID tenantId;
    private UUID userId;
    private Incident testIncident;

    @BeforeEach
    void setUp() {
        tenantId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        userId = UUID.randomUUID();
        testIncident = buildTestIncident();
    }

    private Incident buildTestIncident() {
        Incident incident = Incident.builder()
                .title("Test Incident")
                .description("Test description")
                .priority(Incident.IncidentPriority.MEDIUM)
                .status(Incident.IncidentStatus.OPEN)
                .escalationLevel(0)
                .build();
        incident.setTenantId(tenantId);
        incident.setId(UUID.randomUUID());
        incident.setCreatedAt(LocalDateTime.now());
        incident.setUpdatedAt(LocalDateTime.now());
        incident.setCreatedBy("test-user");
        return incident;
    }

    private void mockSecurityContext() {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .claim("sub", "user-123")
                .claim("tenant_id", tenantId.toString())
                .build();
        Authentication auth = new UsernamePasswordAuthenticationToken(jwt, jwt);
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
    }

    private void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Nested
    @DisplayName("createIncident")
    class CreateIncidentTests {

        @Test
        @DisplayName("should create incident with valid fields and publish IncidentCreatedEvent")
        void shouldCreateIncident_whenValidRequest_givenAllFields() {
            mockSecurityContext();
            UUID serviceId = UUID.randomUUID();
            UUID assigneeId = UUID.randomUUID();
            UUID reporterId = UUID.randomUUID();

            CreateIncidentRequest request = CreateIncidentRequest.builder()
                    .title("Production server down")
                    .description("Server is unresponsive")
                    .priority(Incident.IncidentPriority.HIGH)
                    .impact(Incident.IncidentImpact.WIDESPREAD)
                    .urgency(Incident.IncidentUrgency.CRITICAL)
                    .category("Hardware")
                    .subcategory("Server")
                    .serviceId(serviceId)
                    .assigneeId(assigneeId)
                    .reporterId(reporterId)
                    .build();

            when(incidentRepository.save(any(Incident.class))).thenAnswer(invocation -> {
                Incident inc = invocation.getArgument(0);
                inc.setId(UUID.randomUUID());
                inc.setCreatedAt(LocalDateTime.now());
                inc.setUpdatedAt(LocalDateTime.now());
                return inc;
            });

            IncidentResponse response = incidentService.createIncident(request);

            assertThat(response).isNotNull();
            assertThat(response.getTitle()).isEqualTo("Production server down");
            assertThat(response.getPriority()).isEqualTo(Incident.IncidentPriority.HIGH);
            assertThat(response.getStatus()).isEqualTo(Incident.IncidentStatus.OPEN);
            assertThat(response.getServiceId()).isEqualTo(serviceId);
            assertThat(response.getAssigneeId()).isEqualTo(assigneeId);

            ArgumentCaptor<IncidentCreatedEvent> eventCaptor = ArgumentCaptor.forClass(IncidentCreatedEvent.class);
            verify(eventPublisher).publish(eventCaptor.capture());
            IncidentCreatedEvent event = eventCaptor.getValue();
            assertThat(event.getIncidentId()).isEqualTo(response.getId());
            assertThat(event.getTitle()).isEqualTo("Production server down");
            assertThat(event.getPriority()).isEqualTo("HIGH");
            assertThat(event.getServiceId()).isEqualTo(serviceId);

            verify(incidentRepository).save(argThat(inc ->
                    inc.getStatus() == Incident.IncidentStatus.OPEN &&
                    inc.getEscalationLevel() == 0 &&
                    inc.getSlaResponseTarget() != null &&
                    inc.getSlaResolutionTarget() != null
            ));

            clearSecurityContext();
        }

        @Test
        @DisplayName("should apply defaults when optional fields are null")
        void shouldCreateIncident_whenMinimalRequest_givenDefaultsApplied() {
            mockSecurityContext();
            CreateIncidentRequest request = CreateIncidentRequest.builder()
                    .title("Simple incident")
                    .build();

            when(incidentRepository.save(any(Incident.class))).thenAnswer(invocation -> {
                Incident inc = invocation.getArgument(0);
                inc.setId(UUID.randomUUID());
                inc.setCreatedAt(LocalDateTime.now());
                inc.setUpdatedAt(LocalDateTime.now());
                return inc;
            });

            IncidentResponse response = incidentService.createIncident(request);

            assertThat(response.getPriority()).isEqualTo(Incident.IncidentPriority.MEDIUM);
            assertThat(response.getImpact()).isEqualTo(Incident.IncidentImpact.MODERATE);
            assertThat(response.getUrgency()).isEqualTo(Incident.IncidentUrgency.MEDIUM);
            assertThat(response.getStatus()).isEqualTo(Incident.IncidentStatus.OPEN);

            clearSecurityContext();
        }

        @Test
        @DisplayName("should set SLA targets based on CRITICAL priority")
        void shouldSetSlaTargets_whenCriticalPriority_givenOneHourResponse() {
            mockSecurityContext();
            CreateIncidentRequest request = CreateIncidentRequest.builder()
                    .title("Critical issue")
                    .priority(Incident.IncidentPriority.CRITICAL)
                    .build();

            when(incidentRepository.save(any(Incident.class))).thenAnswer(invocation -> {
                Incident inc = invocation.getArgument(0);
                inc.setId(UUID.randomUUID());
                inc.setCreatedAt(LocalDateTime.now());
                inc.setUpdatedAt(LocalDateTime.now());
                return inc;
            });

            incidentService.createIncident(request);

            verify(incidentRepository).save(argThat(inc -> {
                LocalDateTime now = LocalDateTime.now();
                return inc.getSlaResponseTarget() != null &&
                       inc.getSlaResolutionTarget() != null &&
                       inc.getSlaResponseTarget().isBefore(now.plusHours(2)) &&
                       inc.getSlaResolutionTarget().isBefore(now.plusHours(5));
            }));

            clearSecurityContext();
        }
    }

    @Nested
    @DisplayName("assignIncident")
    class AssignIncidentTests {

        @Test
        @DisplayName("should assign incident and publish IncidentAssignedEvent")
        void shouldAssignIncident_whenValid_givenAssigneeId() {
            UUID newAssigneeId = UUID.randomUUID();
            UUID groupId = UUID.randomUUID();

            when(incidentRepository.findById(testIncident.getId())).thenReturn(Optional.of(testIncident));
            when(incidentRepository.save(any(Incident.class))).thenReturn(testIncident);

            IncidentResponse response = incidentService.assignIncident(testIncident.getId(), newAssigneeId, groupId);

            assertThat(response).isNotNull();

            ArgumentCaptor<IncidentAssignedEvent> eventCaptor = ArgumentCaptor.forClass(IncidentAssignedEvent.class);
            verify(eventPublisher).publish(eventCaptor.capture());
            assertThat(eventCaptor.getValue().getAssigneeId()).isEqualTo(newAssigneeId);
            assertThat(eventCaptor.getValue().getAssigneeGroupId()).isEqualTo(groupId);

            verify(incidentRepository).save(argThat(inc ->
                    inc.getAssigneeId().equals(newAssigneeId) &&
                    inc.getAssigneeGroupId().equals(groupId)
            ));
        }

        @Test
        @DisplayName("should throw BusinessRuleException when assigning closed incident")
        void shouldThrowException_whenAssigning_givenClosedIncident() {
            testIncident.setStatus(Incident.IncidentStatus.CLOSED);
            when(incidentRepository.findById(testIncident.getId())).thenReturn(Optional.of(testIncident));

            assertThatThrownBy(() -> incidentService.assignIncident(testIncident.getId(), UUID.randomUUID(), null))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("closed or cancelled");

            verify(eventPublisher, never()).publish(any());
        }
    }

    @Nested
    @DisplayName("escalateIncident")
    class EscalateIncidentTests {

        @Test
        @DisplayName("should increase escalation level and publish IncidentEscalatedEvent")
        void shouldEscalate_whenValid_givenOpenIncident() {
            UUID newAssigneeId = UUID.randomUUID();

            when(incidentRepository.findById(testIncident.getId())).thenReturn(Optional.of(testIncident));
            when(incidentRepository.save(any(Incident.class))).thenReturn(testIncident);

            IncidentResponse response = incidentService.escalateIncident(testIncident.getId(), "No response within SLA", newAssigneeId);

            assertThat(response).isNotNull();

            verify(incidentRepository).save(argThat(inc ->
                    inc.getEscalationLevel() == 1 &&
                    inc.getAssigneeId().equals(newAssigneeId) &&
                    inc.getStatus() == Incident.IncidentStatus.IN_PROGRESS
            ));

            ArgumentCaptor<IncidentEscalatedEvent> eventCaptor = ArgumentCaptor.forClass(IncidentEscalatedEvent.class);
            verify(eventPublisher).publish(eventCaptor.capture());
            assertThat(eventCaptor.getValue().getEscalationLevel()).isEqualTo(1);
            assertThat(eventCaptor.getValue().getEscalationReason()).isEqualTo("No response within SLA");
        }

        @Test
        @DisplayName("should increment escalation level on subsequent escalations")
        void shouldIncrementEscalationLevel_whenEscalated_givenExistingEscalation() {
            testIncident.setEscalationLevel(2);

            when(incidentRepository.findById(testIncident.getId())).thenReturn(Optional.of(testIncident));
            when(incidentRepository.save(any(Incident.class))).thenReturn(testIncident);

            incidentService.escalateIncident(testIncident.getId(), "Still unresolved", null);

            verify(incidentRepository).save(argThat(inc -> inc.getEscalationLevel() == 3));
        }
    }

    @Nested
    @DisplayName("resolveIncident")
    class ResolveIncidentTests {

        @Test
        @DisplayName("should resolve incident and publish IncidentResolvedEvent")
        void shouldResolveIncident_whenValid_givenOpenIncident() {
            testIncident.setStatus(Incident.IncidentStatus.IN_PROGRESS);
            mockSecurityContext();

            when(incidentRepository.findById(testIncident.getId())).thenReturn(Optional.of(testIncident));
            when(incidentRepository.save(any(Incident.class))).thenReturn(testIncident);

            IncidentResponse response = incidentService.resolveIncident(
                    testIncident.getId(), "Fixed by restarting service", "PERMANENT_FIX");

            assertThat(response).isNotNull();

            verify(incidentRepository).save(argThat(inc ->
                    inc.getStatus() == Incident.IncidentStatus.RESOLVED &&
                    "Fixed by restarting service".equals(inc.getResolution()) &&
                    "PERMANENT_FIX".equals(inc.getResolutionCode()) &&
                    inc.getResolvedAt() != null
            ));

            ArgumentCaptor<IncidentResolvedEvent> eventCaptor = ArgumentCaptor.forClass(IncidentResolvedEvent.class);
            verify(eventPublisher).publish(eventCaptor.capture());
            assertThat(eventCaptor.getValue().getResolution()).isEqualTo("Fixed by restarting service");
            assertThat(eventCaptor.getValue().getResolutionCode()).isEqualTo("PERMANENT_FIX");

            clearSecurityContext();
        }

        @Test
        @DisplayName("should throw BusinessRuleException when resolving already resolved incident")
        void shouldThrowException_whenResolving_givenAlreadyResolved() {
            testIncident.setStatus(Incident.IncidentStatus.RESOLVED);
            when(incidentRepository.findById(testIncident.getId())).thenReturn(Optional.of(testIncident));

            assertThatThrownBy(() -> incidentService.resolveIncident(testIncident.getId(), "fix", "code"))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("already resolved or closed");

            verify(eventPublisher, never()).publish(any());
        }
    }

    @Nested
    @DisplayName("closeIncident")
    class CloseIncidentTests {

        @Test
        @DisplayName("should close a resolved incident")
        void shouldCloseIncident_whenResolved_givenValidClosure() {
            testIncident.setStatus(Incident.IncidentStatus.RESOLVED);
            mockSecurityContext();

            when(incidentRepository.findById(testIncident.getId())).thenReturn(Optional.of(testIncident));
            when(incidentRepository.save(any(Incident.class))).thenReturn(testIncident);

            IncidentResponse response = incidentService.closeIncident(testIncident.getId(), "CONFIRMED");

            assertThat(response).isNotNull();
            verify(incidentRepository).save(argThat(inc ->
                    inc.getStatus() == Incident.IncidentStatus.CLOSED &&
                    "CONFIRMED".equals(inc.getClosureCode()) &&
                    inc.getClosedAt() != null
            ));

            clearSecurityContext();
        }

        @Test
        @DisplayName("should throw BusinessRuleException when closing non-resolved incident")
        void shouldThrowException_whenClosing_givenOpenIncident() {
            testIncident.setStatus(Incident.IncidentStatus.OPEN);
            when(incidentRepository.findById(testIncident.getId())).thenReturn(Optional.of(testIncident));

            assertThatThrownBy(() -> incidentService.closeIncident(testIncident.getId(), "code"))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("must be resolved");
        }
    }

    @Nested
    @DisplayName("searchIncidents")
    class SearchIncidentsTests {

        @Test
        @DisplayName("should return paginated results with filters")
        void shouldReturnPaginatedResults_whenSearching_givenFilters() {
            mockSecurityContext();
            List<Incident> incidents = List.of(testIncident);
            Page<Incident> page = new PageImpl<>(incidents);

            when(incidentRepository.searchIncidents(
                    eq(tenantId), eq(Incident.IncidentStatus.OPEN),
                    eq(Incident.IncidentPriority.HIGH), any(), any(),
                    any(), eq(""), any(Pageable.class)))
                    .thenReturn(page);

            Page<IncidentResponse> result = incidentService.searchIncidents(
                    Incident.IncidentStatus.OPEN, Incident.IncidentPriority.HIGH,
                    null, null, null, null,
                    0, 20, "createdAt", "DESC");

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getTitle()).isEqualTo("Test Incident");

            clearSecurityContext();
        }
    }

    @Nested
    @DisplayName("deleteIncident")
    class DeleteIncidentTests {

        @Test
        @DisplayName("should soft delete incident by setting deletedAt")
        void shouldSoftDelete_whenDeleting_givenExistingIncident() {
            when(incidentRepository.findById(testIncident.getId())).thenReturn(Optional.of(testIncident));
            when(incidentRepository.save(any(Incident.class))).thenReturn(testIncident);

            incidentService.deleteIncident(testIncident.getId());

            verify(incidentRepository).save(argThat(Incident::isDeleted));
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when incident not found")
        void shouldThrowNotFoundException_whenDeleting_givenNonexistentId() {
            UUID randomId = UUID.randomUUID();
            when(incidentRepository.findById(randomId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> incidentService.deleteIncident(randomId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Incident");
        }
    }

    @Nested
    @DisplayName("getIncident")
    class GetIncidentTests {

        @Test
        @DisplayName("should return incident when found")
        void shouldReturnIncident_whenFound_givenExistingId() {
            when(incidentRepository.findById(testIncident.getId())).thenReturn(Optional.of(testIncident));

            IncidentResponse response = incidentService.getIncident(testIncident.getId());

            assertThat(response).isNotNull();
            assertThat(response.getTitle()).isEqualTo("Test Incident");
            assertThat(response.getStatus()).isEqualTo(Incident.IncidentStatus.OPEN);
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when not found")
        void shouldThrowNotFoundException_whenNotFound_givenNonexistentId() {
            UUID randomId = UUID.randomUUID();
            when(incidentRepository.findById(randomId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> incidentService.getIncident(randomId))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when incident is soft-deleted")
        void shouldThrowNotFoundException_whenSoftDeleted_givenDeletedIncident() {
            testIncident.softDelete();
            when(incidentRepository.findById(testIncident.getId())).thenReturn(Optional.of(testIncident));

            assertThatThrownBy(() -> incidentService.getIncident(testIncident.getId()))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
