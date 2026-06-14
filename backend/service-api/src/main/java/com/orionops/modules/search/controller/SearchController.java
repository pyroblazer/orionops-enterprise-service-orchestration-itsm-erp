package com.orionops.modules.search.controller;

import com.orionops.common.dto.ApiResponse;
import com.orionops.common.dto.PagedResponse;
import com.orionops.modules.search.dto.SearchRequest;
import com.orionops.modules.search.dto.SearchResponse;
import com.orionops.modules.search.service.SearchService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
@Tag(name = "Search", description = "Full-text search across entities")
public class SearchController {

    private final SearchService searchService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PagedResponse<SearchResponse>>> search(@RequestBody SearchRequest request) {
        Page<SearchResponse> result = searchService.search(request);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(result)));
    }
}
