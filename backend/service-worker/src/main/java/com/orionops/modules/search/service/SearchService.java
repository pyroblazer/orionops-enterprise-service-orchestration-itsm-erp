package com.orionops.modules.search.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orionops.common.tenant.TenantContextHolder;
import com.orionops.modules.search.dto.SearchRequest;
import com.orionops.modules.search.dto.SearchResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.opensearch.client.opensearch.OpenSearchClient;
import org.opensearch.client.opensearch.core.DeleteRequest;
import org.opensearch.client.opensearch.core.IndexRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SearchService {

    private final ObjectMapper objectMapper;

    @Autowired(required = false)
    private OpenSearchClient openSearchClient;

    @Transactional(readOnly = true)
    public Page<SearchResponse> search(SearchRequest request) {
        log.info("Search request received: query={}, types={}, page={}, size={}",
                request.getQuery(), request.getEntityTypes(), request.getPage(), request.getSize());
        List<SearchResponse> results = new ArrayList<>();
        int start = (int) PageRequest.of(request.getPage(), request.getSize()).getOffset();
        int end = Math.min(start + request.getSize(), results.size());
        List<SearchResponse> pageContent = start < results.size() ? results.subList(start, end) : List.of();
        return new PageImpl<>(pageContent, PageRequest.of(request.getPage(), request.getSize()), results.size());
    }

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
