package com.orionops.modules.knowledge.service;

import com.orionops.common.exception.BusinessRuleException;
import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.modules.knowledge.dto.KnowledgeArticleRequest;
import com.orionops.modules.knowledge.dto.KnowledgeArticleResponse;
import com.orionops.modules.knowledge.entity.KnowledgeArticle;
import com.orionops.modules.knowledge.repository.KnowledgeArticleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class KnowledgeService {

    private final KnowledgeArticleRepository articleRepository;

    @Transactional
    public KnowledgeArticleResponse createArticle(KnowledgeArticleRequest request) {
        KnowledgeArticle article = KnowledgeArticle.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .category(request.getCategory())
                .tags(request.getTags())
                .authorId(request.getAuthorId())
                .status(KnowledgeArticle.ArticleStatus.DRAFT)
                .views(0)
                .helpfulVotes(0)
                .build();
        article.setTenantId(resolveTenantId());
        return mapToResponse(articleRepository.save(article));
    }

    @Transactional(readOnly = true)
    public KnowledgeArticleResponse getArticle(UUID id) {
        return mapToResponse(findArticleOrThrow(id));
    }

    @Transactional(readOnly = true)
    public Page<KnowledgeArticleResponse> searchArticles(KnowledgeArticle.ArticleStatus status, String search,
                                                          int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return articleRepository.searchArticles(resolveTenantId(), status,
                search != null ? search : "", pageable).map(this::mapToResponse);
    }

    @Transactional
    public KnowledgeArticleResponse updateArticle(UUID id, KnowledgeArticleRequest request) {
        KnowledgeArticle article = findArticleOrThrow(id);
        if (article.getStatus() == KnowledgeArticle.ArticleStatus.PUBLISHED) {
            throw new BusinessRuleException("Published articles cannot be edited directly. Create a new draft.");
        }
        if (request.getTitle() != null) article.setTitle(request.getTitle());
        if (request.getContent() != null) article.setContent(request.getContent());
        if (request.getCategory() != null) article.setCategory(request.getCategory());
        if (request.getTags() != null) article.setTags(request.getTags());
        return mapToResponse(articleRepository.save(article));
    }

    @Transactional
    public KnowledgeArticleResponse submitForReview(UUID id) {
        KnowledgeArticle article = findArticleOrThrow(id);
        if (article.getStatus() != KnowledgeArticle.ArticleStatus.DRAFT) {
            throw new BusinessRuleException("Only draft articles can be submitted for review");
        }
        article.setStatus(KnowledgeArticle.ArticleStatus.UNDER_REVIEW);
        return mapToResponse(articleRepository.save(article));
    }

    @Transactional
    public KnowledgeArticleResponse publishArticle(UUID id) {
        KnowledgeArticle article = findArticleOrThrow(id);
        if (article.getStatus() != KnowledgeArticle.ArticleStatus.UNDER_REVIEW) {
            throw new BusinessRuleException("Only reviewed articles can be published");
        }
        article.setStatus(KnowledgeArticle.ArticleStatus.PUBLISHED);
        return mapToResponse(articleRepository.save(article));
    }

    @Transactional
    public void deleteArticle(UUID id) {
        KnowledgeArticle article = findArticleOrThrow(id);
        article.softDelete();
        articleRepository.save(article);
    }

    private KnowledgeArticle findArticleOrThrow(UUID id) {
        return articleRepository.findById(id)
                .filter(a -> !a.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("KnowledgeArticle", id));
    }

    private UUID resolveTenantId() {
        return UUID.fromString("00000000-0000-0000-0000-000000000001");
    }

    private KnowledgeArticleResponse mapToResponse(KnowledgeArticle a) {
        return KnowledgeArticleResponse.builder()
                .id(a.getId()).title(a.getTitle()).content(a.getContent())
                .status(a.getStatus()).category(a.getCategory()).tags(a.getTags())
                .authorId(a.getAuthorId()).reviewerId(a.getReviewerId()).publishedBy(a.getPublishedBy())
                .views(a.getViews()).helpfulVotes(a.getHelpfulVotes())
                .tenantId(a.getTenantId()).createdBy(a.getCreatedBy())
                .createdAt(a.getCreatedAt()).updatedAt(a.getUpdatedAt()).build();
    }
}
