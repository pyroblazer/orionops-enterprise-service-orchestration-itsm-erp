package com.orionops.modules.knowledge.controller;

import com.orionops.common.dto.ApiResponse;
import com.orionops.common.dto.PagedResponse;
import com.orionops.modules.knowledge.dto.KnowledgeArticleRequest;
import com.orionops.modules.knowledge.dto.KnowledgeArticleResponse;
import com.orionops.modules.knowledge.entity.KnowledgeArticle;
import com.orionops.modules.knowledge.service.KnowledgeService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/knowledge")
@RequiredArgsConstructor
@Tag(name = "Knowledge", description = "Knowledge base management")
public class KnowledgeController {

    private final KnowledgeService knowledgeService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<KnowledgeArticleResponse>> createArticle(@Valid @RequestBody KnowledgeArticleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(knowledgeService.createArticle(request), "Article created"));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PagedResponse<KnowledgeArticleResponse>>> searchArticles(
            @RequestParam(required = false) KnowledgeArticle.ArticleStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<KnowledgeArticleResponse> result = knowledgeService.searchArticles(status, search, page, size);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(result)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<KnowledgeArticleResponse>> getArticle(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(knowledgeService.getArticle(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ENGINEER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<KnowledgeArticleResponse>> updateArticle(
            @PathVariable UUID id, @Valid @RequestBody KnowledgeArticleRequest request) {
        return ResponseEntity.ok(ApiResponse.success(knowledgeService.updateArticle(id, request), "Article updated"));
    }

    @PatchMapping("/{id}/submit-for-review")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<KnowledgeArticleResponse>> submitForReview(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(knowledgeService.submitForReview(id), "Article submitted for review"));
    }

    @PatchMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<KnowledgeArticleResponse>> publishArticle(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(knowledgeService.publishArticle(id), "Article published"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteArticle(@PathVariable UUID id) {
        knowledgeService.deleteArticle(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Article deleted"));
    }
}
