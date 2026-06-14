package com.orionops.modules.search.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orionops.modules.incident.repository.IncidentRepository;
import com.orionops.modules.knowledge.repository.KnowledgeArticleRepository;
import com.orionops.modules.problem.repository.ProblemRepository;
import com.orionops.modules.change.repository.ChangeRequestRepository;
import com.orionops.modules.search.dto.SearchRequest;
import com.orionops.modules.search.dto.SearchResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.opensearch.client.opensearch.OpenSearchClient;
import org.opensearch.client.opensearch.core.IndexRequest;
import org.opensearch.client.opensearch.core.DeleteRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.orionops.common.tenant.TenantContextHolder;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Full-text search across incidents, problems, changes, and knowledge articles.
 * In production, this would use OpenSearch/Elasticsearch for indexing.
 * This implementation uses database LIKE queries as a fallback.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SearchService {

    private final IncidentRepository incidentRepository;
    private final ProblemRepository problemRepository;
    private final ChangeRequestRepository changeRequestRepository;
    private final KnowledgeArticleRepository knowledgeArticleRepository;

    @Autowired(required = false)
    private OpenSearchClient openSearchClient;

    @Autowired
    private ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public Page<SearchResponse> search(SearchRequest request) {
        String query = request.getQuery() != null ? request.getQuery() : "";
        UUID tenantId = request.getTenantId() != null ? request.getTenantId() : resolveTenantId();
        List<String> types = request.getEntityTypes();
        List<SearchResponse> results = new ArrayList<>();

        if (types == null || types.contains("incident")) {
            incidentRepository.searchIncidents(tenantId, null, null, null, null, null, query,
                    PageRequest.of(0, 50)).forEach(i ->
                    results.add(SearchResponse.builder().id(i.getId()).entityType("incident")
                            .title(i.getTitle()).description(i.getDescription())
                            .status(i.getStatus() != null ? i.getStatus().name() : null).score(1.0).build()));
        }

        if (types == null || types.contains("problem")) {
            problemRepository.searchProblems(tenantId, null, null, query,
                    PageRequest.of(0, 50)).forEach(p ->
                    results.add(SearchResponse.builder().id(p.getId()).entityType("problem")
                            .title(p.getTitle()).description(p.getDescription())
                            .status(p.getStatus() != null ? p.getStatus().name() : null).score(1.0).build()));
        }

        if (types == null || types.contains("change")) {
            changeRequestRepository.searchChanges(tenantId, null, null, query,
                    PageRequest.of(0, 50)).forEach(c ->
                    results.add(SearchResponse.builder().id(c.getId()).entityType("change")
                            .title(c.getTitle()).description(c.getDescription())
                            .status(c.getStatus() != null ? c.getStatus().name() : null).score(1.0).build()));
        }

        if (types == null || types.contains("knowledge")) {
            knowledgeArticleRepository.searchArticles(tenantId, null, query,
                    PageRequest.of(0, 50)).forEach(k ->
                    results.add(SearchResponse.builder().id(k.getId()).entityType("knowledge")
                            .title(k.getTitle()).description(k.getContent())
                            .status(k.getStatus() != null ? k.getStatus().name() : null).score(1.0).build()));
        }

        int start = (int) PageRequest.of(request.getPage(), request.getSize()).getOffset();
        int end = Math.min(start + request.getSize(), results.size());
        List<SearchResponse> pageContent = start < results.size() ? results.subList(start, end) : List.of();

        return new PageImpl<>(pageContent, PageRequest.of(request.getPage(), request.getSize()), results.size());
    }

    // ---- OpenSearch Indexing ----

    public void indexIncident(UUID incidentId, String title, String description, String status) {
        if (openSearchClient == null) {
            log.debug("OpenSearch client not available, skipping indexing");
            return;
        }

        try {
            Map<String, Object> document = new HashMap<>();
            document.put("id", incidentId);
            document.put("title", title);
            document.put("description", description);
            document.put("status", status);
            document.put("entityType", "incident");
            document.put("indexedAt", System.currentTimeMillis());

            IndexRequest<Map<String, Object>> indexRequest = new IndexRequest.Builder<Map<String, Object>>()
                .index("incidents")
                .id(incidentId.toString())
                .document(document)
                .build();

            openSearchClient.index(indexRequest);
            log.debug("Incident {} indexed in OpenSearch", incidentId);
        } catch (IOException e) {
            log.warn("Failed to index incident in OpenSearch: {}", e.getMessage());
        }
    }

    public void deleteDocument(String index, UUID documentId) {
        if (openSearchClient == null) {
            log.debug("OpenSearch client not available, skipping deletion");
            return;
        }

        try {
            DeleteRequest deleteRequest = new DeleteRequest.Builder()
                .index(index)
                .id(documentId.toString())
                .build();

            openSearchClient.delete(deleteRequest);
            log.debug("Document {} deleted from {} index in OpenSearch", documentId, index);
        } catch (IOException e) {
            log.warn("Failed to delete document from OpenSearch: {}", e.getMessage());
        }
    }

    private UUID resolveTenantId() {
        return TenantContextHolder.getCurrentTenantId();
    }
}
