package com.orionops.modules.knowledge.repository;

import com.orionops.modules.knowledge.entity.KnowledgeArticle;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface KnowledgeArticleRepository extends JpaRepository<KnowledgeArticle, UUID> {

    Page<KnowledgeArticle> findByTenantIdAndStatusAndDeletedAtIsNull(UUID tenantId, KnowledgeArticle.ArticleStatus status, Pageable pageable);

    @Query("SELECT k FROM KnowledgeArticle k WHERE k.tenantId = :tenantId " +
            "AND k.deletedAt IS NULL " +
            "AND (:status IS NULL OR k.status = :status) " +
            "AND (LOWER(k.title) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "     OR LOWER(k.content) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<KnowledgeArticle> searchArticles(
            @Param("tenantId") UUID tenantId,
            @Param("status") KnowledgeArticle.ArticleStatus status,
            @Param("search") String search,
            Pageable pageable);
}
