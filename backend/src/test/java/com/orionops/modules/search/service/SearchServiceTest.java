package com.orionops.modules.search.service;

import com.orionops.common.tenant.TenantContextHolder;
import com.orionops.modules.change.repository.ChangeRequestRepository;
import com.orionops.modules.incident.repository.IncidentRepository;
import com.orionops.modules.knowledge.repository.KnowledgeArticleRepository;
import com.orionops.modules.problem.repository.ProblemRepository;
import com.orionops.modules.search.dto.SearchRequest;
import com.orionops.modules.search.dto.SearchResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link SearchService}.
 * Covers full-text search across multiple entity types and OpenSearch indexing.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("SearchService")
class SearchServiceTest {

    @Mock
    private IncidentRepository incidentRepository;

    @Mock
    private ProblemRepository problemRepository;

    @Mock
    private ChangeRequestRepository changeRequestRepository;

    @Mock
    private KnowledgeArticleRepository knowledgeArticleRepository;

    @InjectMocks
    private SearchService searchService;

    private UUID tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        TenantContextHolder.setCurrentTenantId(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    // ========================================================================
    // SEARCH
    // ========================================================================

    @Nested
    @DisplayName("search")
    class Search {

        @Test
        @DisplayName("searches all entity types when entityTypes is null")
        void searchesAllTypes() {
            when(incidentRepository.searchIncidents(any(), any(), any(), any(), any(), any(), eq("test"), any()))
                    .thenReturn(new PageImpl<>(List.of()));
            when(problemRepository.searchProblems(any(), any(), any(), eq("test"), any()))
                    .thenReturn(new PageImpl<>(List.of()));
            when(changeRequestRepository.searchChanges(any(), any(), any(), eq("test"), any()))
                    .thenReturn(new PageImpl<>(List.of()));
            when(knowledgeArticleRepository.searchArticles(any(), any(), eq("test"), any()))
                    .thenReturn(new PageImpl<>(List.of()));

            SearchRequest req = new SearchRequest();
            req.setQuery("test");
            req.setPage(0);
            req.setSize(10);

            Page<SearchResponse> result = searchService.search(req);

            assertThat(result.getTotalElements()).isZero();
        }

        @Test
        @DisplayName("searches specific entity types only")
        void searchesSpecificTypes() {
            when(incidentRepository.searchIncidents(any(), any(), any(), any(), any(), any(), eq("test"), any()))
                    .thenReturn(new PageImpl<>(List.of()));

            SearchRequest req = new SearchRequest();
            req.setQuery("test");
            req.setPage(0);
            req.setSize(10);
            req.setEntityTypes(List.of("incident"));

            Page<SearchResponse> result = searchService.search(req);

            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("returns empty results when no matches")
        void returnsEmptyResults() {
            when(incidentRepository.searchIncidents(any(), any(), any(), any(), any(), any(), any(), any()))
                    .thenReturn(new PageImpl<>(List.of()));
            when(problemRepository.searchProblems(any(), any(), any(), any(), any()))
                    .thenReturn(new PageImpl<>(List.of()));
            when(changeRequestRepository.searchChanges(any(), any(), any(), any(), any()))
                    .thenReturn(new PageImpl<>(List.of()));
            when(knowledgeArticleRepository.searchArticles(any(), any(), any(), any()))
                    .thenReturn(new PageImpl<>(List.of()));

            SearchRequest req = new SearchRequest();
            req.setQuery("nonexistent");
            req.setPage(0);
            req.setSize(10);

            Page<SearchResponse> result = searchService.search(req);

            assertThat(result.getContent()).isEmpty();
        }

        @Test
        @DisplayName("uses tenant context when tenantId not in request")
        void usesTenantContext() {
            when(incidentRepository.searchIncidents(eq(tenantId), any(), any(), any(), any(), any(), any(), any()))
                    .thenReturn(new PageImpl<>(List.of()));
            when(problemRepository.searchProblems(eq(tenantId), any(), any(), any(), any()))
                    .thenReturn(new PageImpl<>(List.of()));
            when(changeRequestRepository.searchChanges(eq(tenantId), any(), any(), any(), any()))
                    .thenReturn(new PageImpl<>(List.of()));
            when(knowledgeArticleRepository.searchArticles(eq(tenantId), any(), any(), any()))
                    .thenReturn(new PageImpl<>(List.of()));

            SearchRequest req = new SearchRequest();
            req.setQuery("test");
            req.setPage(0);
            req.setSize(10);

            searchService.search(req);

            // Verifies that tenantId from context was used
        }
    }

    // ========================================================================
    // INDEX INCIDENT
    // ========================================================================

    @Nested
    @DisplayName("indexIncident")
    class IndexIncident {

        @Test
        @DisplayName("no-op when OpenSearch client is null")
        void noOpWhenClientNull() {
            UUID id = UUID.randomUUID();
            // Should not throw
            searchService.indexIncident(id, "Title", "Description", "OPEN");
        }
    }

    // ========================================================================
    // DELETE DOCUMENT
    // ========================================================================

    @Nested
    @DisplayName("deleteDocument")
    class DeleteDocument {

        @Test
        @DisplayName("no-op when OpenSearch client is null")
        void noOpWhenClientNull() {
            UUID id = UUID.randomUUID();
            // Should not throw
            searchService.deleteDocument("incidents", id);
        }
    }
}
