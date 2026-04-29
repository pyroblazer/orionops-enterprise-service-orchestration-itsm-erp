package com.orionops.modules.problem.service;

import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.modules.problem.dto.ProblemRequest;
import com.orionops.modules.problem.dto.ProblemResponse;
import com.orionops.modules.problem.entity.Problem;
import com.orionops.modules.problem.repository.ProblemRepository;
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
 * Unit tests for {@link ProblemService}.
 * Covers CRUD, incident linking, root cause analysis, pagination, and filters.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ProblemService")
class ProblemServiceTest {

    @Mock
    private ProblemRepository problemRepository;

    @InjectMocks
    private ProblemService problemService;

    private Problem testProblem;
    private UUID tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        testProblem = buildTestProblem();
    }

    private Problem buildTestProblem() {
        Problem problem = Problem.builder()
                .title("Recurring login failures")
                .description("Users unable to log in intermittently")
                .priority(Problem.ProblemPriority.HIGH)
                .status(Problem.ProblemStatus.OPEN)
                .category("Authentication")
                .tenantId(tenantId)
                .build();
        problem.setId(UUID.randomUUID());
        problem.setCreatedAt(LocalDateTime.now());
        problem.setUpdatedAt(LocalDateTime.now());
        problem.setCreatedBy("test-user");
        return problem;
    }

    @Nested
    @DisplayName("createProblem")
    class CreateProblemTests {

        @Test
        @DisplayName("should create problem with valid fields")
        void shouldCreateProblem_whenValidRequest_givenAllFields() {
            UUID assigneeId = UUID.randomUUID();
            UUID serviceId = UUID.randomUUID();
            UUID incidentId = UUID.randomUUID();

            ProblemRequest request = ProblemRequest.builder()
                    .title("Database connectivity issues")
                    .description("Intermittent DB connection timeouts")
                    .priority(Problem.ProblemPriority.CRITICAL)
                    .category("Database")
                    .assigneeId(assigneeId)
                    .serviceId(serviceId)
                    .relatedIncidentId(incidentId)
                    .workaround("Restart the connection pool")
                    .build();

            when(problemRepository.save(any(Problem.class))).thenAnswer(invocation -> {
                Problem p = invocation.getArgument(0);
                p.setId(UUID.randomUUID());
                p.setCreatedAt(LocalDateTime.now());
                p.setUpdatedAt(LocalDateTime.now());
                return p;
            });

            ProblemResponse response = problemService.createProblem(request);

            assertThat(response).isNotNull();
            assertThat(response.getTitle()).isEqualTo("Database connectivity issues");
            assertThat(response.getPriority()).isEqualTo(Problem.ProblemPriority.CRITICAL);
            assertThat(response.getStatus()).isEqualTo(Problem.ProblemStatus.OPEN);
            assertThat(response.getWorkaround()).isEqualTo("Restart the connection pool");

            verify(problemRepository).save(any(Problem.class));
        }

        @Test
        @DisplayName("should apply MEDIUM default when priority is null")
        void shouldApplyDefaults_whenPriorityNull_givenMinimalRequest() {
            ProblemRequest request = ProblemRequest.builder()
                    .title("Basic problem")
                    .build();

            when(problemRepository.save(any(Problem.class))).thenAnswer(invocation -> {
                Problem p = invocation.getArgument(0);
                p.setId(UUID.randomUUID());
                p.setCreatedAt(LocalDateTime.now());
                p.setUpdatedAt(LocalDateTime.now());
                return p;
            });

            ProblemResponse response = problemService.createProblem(request);

            assertThat(response.getPriority()).isEqualTo(Problem.ProblemPriority.MEDIUM);
        }
    }

    @Nested
    @DisplayName("getProblem")
    class GetProblemTests {

        @Test
        @DisplayName("should return problem by ID")
        void shouldReturnProblem_whenFound_givenValidId() {
            when(problemRepository.findById(testProblem.getId())).thenReturn(Optional.of(testProblem));

            ProblemResponse response = problemService.getProblem(testProblem.getId());

            assertThat(response).isNotNull();
            assertThat(response.getTitle()).isEqualTo("Recurring login failures");
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when not found")
        void shouldThrowNotFoundException_whenNotFound_givenInvalidId() {
            UUID randomId = UUID.randomUUID();
            when(problemRepository.findById(randomId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> problemService.getProblem(randomId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Problem");
        }
    }

    @Nested
    @DisplayName("updateProblem")
    class UpdateProblemTests {

        @Test
        @DisplayName("should update problem fields")
        void shouldUpdateProblem_whenValidRequest_givenExistingProblem() {
            ProblemRequest request = ProblemRequest.builder()
                    .title("Updated title")
                    .description("Updated description")
                    .priority(Problem.ProblemPriority.LOW)
                    .build();

            when(problemRepository.findById(testProblem.getId())).thenReturn(Optional.of(testProblem));
            when(problemRepository.save(any(Problem.class))).thenReturn(testProblem);

            ProblemResponse response = problemService.updateProblem(testProblem.getId(), request);

            assertThat(response).isNotNull();
            verify(problemRepository).save(any(Problem.class));
        }
    }

    @Nested
    @DisplayName("linkIncident")
    class LinkIncidentTests {

        @Test
        @DisplayName("should link incident to problem")
        void shouldLinkIncident_whenValid_givenProblemAndIncidentId() {
            UUID incidentId = UUID.randomUUID();

            when(problemRepository.findById(testProblem.getId())).thenReturn(Optional.of(testProblem));
            when(problemRepository.save(any(Problem.class))).thenReturn(testProblem);

            ProblemResponse response = problemService.linkIncident(testProblem.getId(), incidentId);

            assertThat(response).isNotNull();

            ArgumentCaptor<Problem> captor = ArgumentCaptor.forClass(Problem.class);
            verify(problemRepository).save(captor.capture());
            assertThat(captor.getValue().getRelatedIncidentId()).isEqualTo(incidentId);
        }
    }

    @Nested
    @DisplayName("setRootCause")
    class SetRootCauseTests {

        @Test
        @DisplayName("should set root cause and change status to ROOT_CAUSE_IDENTIFIED")
        void shouldSetRootCause_whenValid_givenProblemId() {
            when(problemRepository.findById(testProblem.getId())).thenReturn(Optional.of(testProblem));
            when(problemRepository.save(any(Problem.class))).thenReturn(testProblem);

            ProblemResponse response = problemService.setRootCause(testProblem.getId(), "Expired SSL certificate");

            assertThat(response).isNotNull();

            ArgumentCaptor<Problem> captor = ArgumentCaptor.forClass(Problem.class);
            verify(problemRepository).save(captor.capture());
            assertThat(captor.getValue().getRootCause()).isEqualTo("Expired SSL certificate");
            assertThat(captor.getValue().getStatus()).isEqualTo(Problem.ProblemStatus.ROOT_CAUSE_IDENTIFIED);
        }
    }

    @Nested
    @DisplayName("listProblems")
    class ListProblemsTests {

        @Test
        @DisplayName("should return paginated results with filters")
        void shouldReturnPaginatedResults_whenSearching_givenFilters() {
            List<Problem> problems = List.of(testProblem);
            Page<Problem> page = new PageImpl<>(problems);

            when(problemRepository.searchProblems(
                    eq(tenantId), eq(Problem.ProblemStatus.OPEN), eq(null),
                    eq(""), any(Pageable.class)))
                    .thenReturn(page);

            Page<ProblemResponse> result = problemService.listProblems(
                    Problem.ProblemStatus.OPEN, null, 0, 20, "createdAt", "DESC");

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getTitle()).isEqualTo("Recurring login failures");
        }
    }

    @Nested
    @DisplayName("deleteProblem")
    class DeleteProblemTests {

        @Test
        @DisplayName("should soft delete problem")
        void shouldSoftDelete_whenDeleting_givenExistingProblem() {
            when(problemRepository.findById(testProblem.getId())).thenReturn(Optional.of(testProblem));
            when(problemRepository.save(any(Problem.class))).thenReturn(testProblem);

            problemService.deleteProblem(testProblem.getId());

            verify(problemRepository).save(any(Problem.class));
            assertThat(testProblem.isDeleted()).isTrue();
        }
    }
}
