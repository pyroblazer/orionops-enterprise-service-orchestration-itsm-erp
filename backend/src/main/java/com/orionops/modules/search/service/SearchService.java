package com.orionops.modules.search.service;

import com.orionops.modules.incident.repository.IncidentRepository;
import com.orionops.modules.knowledge.repository.KnowledgeArticleRepository;
import com.orionops.modules.problem.repository.ProblemRepository;
import com.orionops.modules.change.repository.ChangeRequestRepository;
import com.orionops.modules.search.dto.SearchRequest;
import com.orionops.modules.search.dto.SearchResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
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

    private UUID resolveTenantId() {
        return UUID.fromString("00000000-0000-0000-0000-000000000001");
    }
}
