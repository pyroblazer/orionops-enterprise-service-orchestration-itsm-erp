package com.orionops.modules.knowledge.service;

import com.orionops.common.exception.BusinessRuleException;
import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.common.tenant.TenantContextHolder;
import com.orionops.modules.knowledge.dto.KnowledgeArticleRequest;
import com.orionops.modules.knowledge.dto.KnowledgeArticleResponse;
import com.orionops.modules.knowledge.entity.KnowledgeArticle;
import com.orionops.modules.knowledge.repository.KnowledgeArticleRepository;
import org.junit.jupiter.api.AfterEach;
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
import org.springframework.data.domain.PageRequest;
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
 * Unit tests for {@link KnowledgeService}.
 * Covers CRUD, state machine (DRAFT → UNDER_REVIEW → PUBLISHED), and validation.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("KnowledgeService")
class KnowledgeServiceTest {

    @Mock
    private KnowledgeArticleRepository articleRepository;

    @InjectMocks
    private KnowledgeService knowledgeService;

    private UUID tenantId;
    private UUID authorId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        authorId = UUID.fromString("00000000-0000-0000-0000-000000000002");
        TenantContextHolder.setCurrentTenantId(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private KnowledgeArticleRequest buildRequest(String title, String content) {
        KnowledgeArticleRequest req = new KnowledgeArticleRequest();
        req.setTitle(title);
        req.setContent(content);
        req.setCategory("Incidents");
        req.setTags("urgent,quick-fix");
        req.setAuthorId(authorId);
        return req;
    }

    private KnowledgeArticle buildArticle(UUID id, String title, KnowledgeArticle.ArticleStatus status) {
        KnowledgeArticle article = KnowledgeArticle.builder()
                .title(title)
                .content("This is article content about " + title)
                .category("Incidents")
                .tags("urgent,quick-fix")
                .authorId(authorId)
                .status(status)
                .views(0)
                .helpfulVotes(0)
                .build();
        article.setId(id);
        article.setTenantId(tenantId);
        return article;
    }

    // ========================================================================
    // CREATE ARTICLE
    // ========================================================================

    @Nested
    @DisplayName("createArticle")
    class CreateArticle {

        @Test
        @DisplayName("creates article with DRAFT status and 0 views/votes")
        void createsDraftWithZeroMetrics() {
            KnowledgeArticleRequest req = buildRequest("New Article", "Content here");

            when(articleRepository.save(any(KnowledgeArticle.class)))
                    .thenAnswer(invocation -> {
                        KnowledgeArticle a = invocation.getArgument(0);
                        a.setId(UUID.randomUUID());
                        return a;
                    });

            KnowledgeArticleResponse response = knowledgeService.createArticle(req);

            ArgumentCaptor<KnowledgeArticle> captor = ArgumentCaptor.forClass(KnowledgeArticle.class);
            verify(articleRepository).save(captor.capture());
            KnowledgeArticle saved = captor.getValue();

            assertThat(saved.getStatus()).isEqualTo(KnowledgeArticle.ArticleStatus.DRAFT);
            assertThat(saved.getViews()).isZero();
            assertThat(saved.getHelpfulVotes()).isZero();
        }

        @Test
        @DisplayName("sets tenantId from context")
        void setsTenantId() {
            KnowledgeArticleRequest req = buildRequest("Article", "Content");

            when(articleRepository.save(any(KnowledgeArticle.class)))
                    .thenAnswer(invocation -> {
                        KnowledgeArticle a = invocation.getArgument(0);
                        a.setId(UUID.randomUUID());
                        return a;
                    });

            knowledgeService.createArticle(req);

            ArgumentCaptor<KnowledgeArticle> captor = ArgumentCaptor.forClass(KnowledgeArticle.class);
            verify(articleRepository).save(captor.capture());
            assertThat(captor.getValue().getTenantId()).isEqualTo(tenantId);
        }
    }

    // ========================================================================
    // GET ARTICLE
    // ========================================================================

    @Nested
    @DisplayName("getArticle")
    class GetArticle {

        @Test
        @DisplayName("returns article for valid ID")
        void returnsArticle() {
            UUID id = UUID.randomUUID();
            KnowledgeArticle article = buildArticle(id, "Troubleshooting", KnowledgeArticle.ArticleStatus.PUBLISHED);
            when(articleRepository.findById(id)).thenReturn(Optional.of(article));

            KnowledgeArticleResponse response = knowledgeService.getArticle(id);

            assertThat(response.getTitle()).isEqualTo("Troubleshooting");
            assertThat(response.getStatus()).isEqualTo(KnowledgeArticle.ArticleStatus.PUBLISHED);
        }

        @Test
        @DisplayName("throws ResourceNotFoundException for missing article")
        void throwsForMissing() {
            UUID id = UUID.randomUUID();
            when(articleRepository.findById(id)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> knowledgeService.getArticle(id))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("throws ResourceNotFoundException for soft-deleted article")
        void throwsForSoftDeleted() {
            UUID id = UUID.randomUUID();
            KnowledgeArticle article = buildArticle(id, "Deleted", KnowledgeArticle.ArticleStatus.DRAFT);
            article.softDelete();
            when(articleRepository.findById(id)).thenReturn(Optional.of(article));

            assertThatThrownBy(() -> knowledgeService.getArticle(id))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ========================================================================
    // UPDATE ARTICLE
    // ========================================================================

    @Nested
    @DisplayName("updateArticle")
    class UpdateArticle {

        @Test
        @DisplayName("DRAFT article: updates fields")
        void draftArticle_updatesFields() {
            UUID id = UUID.randomUUID();
            KnowledgeArticle article = buildArticle(id, "Old Title", KnowledgeArticle.ArticleStatus.DRAFT);
            when(articleRepository.findById(id)).thenReturn(Optional.of(article));
            when(articleRepository.save(any(KnowledgeArticle.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            KnowledgeArticleRequest req = new KnowledgeArticleRequest();
            req.setTitle("New Title");
            req.setContent("Updated content");

            KnowledgeArticleResponse response = knowledgeService.updateArticle(id, req);

            assertThat(response.getTitle()).isEqualTo("New Title");
            assertThat(response.getContent()).isEqualTo("Updated content");
        }

        @Test
        @DisplayName("PUBLISHED article: throws BusinessRuleException")
        void publishedArticle_throwsException() {
            UUID id = UUID.randomUUID();
            KnowledgeArticle article = buildArticle(id, "Published", KnowledgeArticle.ArticleStatus.PUBLISHED);
            when(articleRepository.findById(id)).thenReturn(Optional.of(article));

            KnowledgeArticleRequest req = new KnowledgeArticleRequest();
            req.setTitle("New Title");

            assertThatThrownBy(() -> knowledgeService.updateArticle(id, req))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("Published articles cannot be edited");
        }

        @Test
        @DisplayName("partial update: only non-null fields changed")
        void partialUpdate() {
            UUID id = UUID.randomUUID();
            KnowledgeArticle article = buildArticle(id, "Original", KnowledgeArticle.ArticleStatus.DRAFT);
            String originalContent = article.getContent();
            when(articleRepository.findById(id)).thenReturn(Optional.of(article));
            when(articleRepository.save(any(KnowledgeArticle.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            KnowledgeArticleRequest req = new KnowledgeArticleRequest();
            req.setTitle("New Title");
            // content, category, tags are null → unchanged

            KnowledgeArticleResponse response = knowledgeService.updateArticle(id, req);

            assertThat(response.getTitle()).isEqualTo("New Title");
            assertThat(response.getContent()).isEqualTo(originalContent);
        }
    }

    // ========================================================================
    // SUBMIT FOR REVIEW
    // ========================================================================

    @Nested
    @DisplayName("submitForReview")
    class SubmitForReview {

        @Test
        @DisplayName("DRAFT → UNDER_REVIEW")
        void draftToUnderReview() {
            UUID id = UUID.randomUUID();
            KnowledgeArticle article = buildArticle(id, "Draft Article", KnowledgeArticle.ArticleStatus.DRAFT);
            when(articleRepository.findById(id)).thenReturn(Optional.of(article));
            when(articleRepository.save(any(KnowledgeArticle.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            KnowledgeArticleResponse response = knowledgeService.submitForReview(id);

            assertThat(response.getStatus()).isEqualTo(KnowledgeArticle.ArticleStatus.UNDER_REVIEW);
        }

        @Test
        @DisplayName("non-DRAFT article: throws BusinessRuleException")
        void nonDraft_throwsException() {
            UUID id = UUID.randomUUID();
            KnowledgeArticle article = buildArticle(id, "Published", KnowledgeArticle.ArticleStatus.PUBLISHED);
            when(articleRepository.findById(id)).thenReturn(Optional.of(article));

            assertThatThrownBy(() -> knowledgeService.submitForReview(id))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("Only draft articles can be submitted");
        }
    }

    // ========================================================================
    // PUBLISH ARTICLE
    // ========================================================================

    @Nested
    @DisplayName("publishArticle")
    class PublishArticle {

        @Test
        @DisplayName("UNDER_REVIEW → PUBLISHED")
        void underReviewToPublished() {
            UUID id = UUID.randomUUID();
            KnowledgeArticle article = buildArticle(id, "Reviewed", KnowledgeArticle.ArticleStatus.UNDER_REVIEW);
            when(articleRepository.findById(id)).thenReturn(Optional.of(article));
            when(articleRepository.save(any(KnowledgeArticle.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            KnowledgeArticleResponse response = knowledgeService.publishArticle(id);

            assertThat(response.getStatus()).isEqualTo(KnowledgeArticle.ArticleStatus.PUBLISHED);
        }

        @Test
        @DisplayName("non-UNDER_REVIEW article: throws BusinessRuleException")
        void nonUnderReview_throwsException() {
            UUID id = UUID.randomUUID();
            KnowledgeArticle article = buildArticle(id, "Draft", KnowledgeArticle.ArticleStatus.DRAFT);
            when(articleRepository.findById(id)).thenReturn(Optional.of(article));

            assertThatThrownBy(() -> knowledgeService.publishArticle(id))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("Only reviewed articles can be published");
        }
    }

    // ========================================================================
    // DELETE ARTICLE
    // ========================================================================

    @Nested
    @DisplayName("deleteArticle")
    class DeleteArticle {

        @Test
        @DisplayName("soft deletes article by setting deletedAt")
        void softDeletesArticle() {
            UUID id = UUID.randomUUID();
            KnowledgeArticle article = buildArticle(id, "To Delete", KnowledgeArticle.ArticleStatus.DRAFT);
            when(articleRepository.findById(id)).thenReturn(Optional.of(article));
            when(articleRepository.save(any(KnowledgeArticle.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            knowledgeService.deleteArticle(id);

            ArgumentCaptor<KnowledgeArticle> captor = ArgumentCaptor.forClass(KnowledgeArticle.class);
            verify(articleRepository).save(captor.capture());
            assertThat(captor.getValue().isDeleted()).isTrue();
        }
    }

    // ========================================================================
    // SEARCH ARTICLES
    // ========================================================================

    @Nested
    @DisplayName("searchArticles")
    class SearchArticles {

        @Test
        @DisplayName("returns paginated results for matching articles")
        void returnsPaginatedResults() {
            KnowledgeArticle article1 = buildArticle(UUID.randomUUID(), "Incident Response", KnowledgeArticle.ArticleStatus.PUBLISHED);
            KnowledgeArticle article2 = buildArticle(UUID.randomUUID(), "Handling Incidents", KnowledgeArticle.ArticleStatus.PUBLISHED);
            Page<KnowledgeArticle> page = new PageImpl<>(List.of(article1, article2));

            when(articleRepository.searchArticles(eq(tenantId), any(), any(), any()))
                    .thenReturn(page);

            Page<KnowledgeArticleResponse> result = knowledgeService.searchArticles(
                    KnowledgeArticle.ArticleStatus.PUBLISHED, "incident", 0, 10
            );

            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getTotalElements()).isEqualTo(2);
        }

        @Test
        @DisplayName("tenant-scoped: only returns articles for current tenant")
        void tenantScoped() {
            Page<KnowledgeArticle> page = new PageImpl<>(List.of());
            when(articleRepository.searchArticles(eq(tenantId), any(), any(), any()))
                    .thenReturn(page);

            knowledgeService.searchArticles(KnowledgeArticle.ArticleStatus.PUBLISHED, "test", 0, 10);

            verify(articleRepository).searchArticles(eq(tenantId), any(), any(), any());
        }
    }

    // ========================================================================
    // STATE MACHINE HAPPY PATH
    // ========================================================================

    @Nested
    @DisplayName("state machine full lifecycle")
    class StateMachineFullLifecycle {

        @Test
        @DisplayName("DRAFT → UNDER_REVIEW → PUBLISHED")
        void fullLifecycle() {
            UUID id = UUID.randomUUID();
            KnowledgeArticle article = buildArticle(id, "Complete Lifecycle", KnowledgeArticle.ArticleStatus.DRAFT);
            when(articleRepository.findById(id)).thenReturn(Optional.of(article));
            when(articleRepository.save(any(KnowledgeArticle.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            // Step 1: Submit for review (DRAFT → UNDER_REVIEW)
            KnowledgeArticleResponse step1 = knowledgeService.submitForReview(id);
            assertThat(step1.getStatus()).isEqualTo(KnowledgeArticle.ArticleStatus.UNDER_REVIEW);
            article.setStatus(KnowledgeArticle.ArticleStatus.UNDER_REVIEW);

            // Step 2: Publish (UNDER_REVIEW → PUBLISHED)
            KnowledgeArticleResponse step2 = knowledgeService.publishArticle(id);
            assertThat(step2.getStatus()).isEqualTo(KnowledgeArticle.ArticleStatus.PUBLISHED);
        }
    }
}
