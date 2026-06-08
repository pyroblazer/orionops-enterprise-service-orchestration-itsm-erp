package com.orionops.modules.knowledge.entity;

import com.orionops.common.auditing.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "knowledge_articles")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeArticle extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ArticleStatus status = ArticleStatus.DRAFT;

    @Column
    private String category;

    @Column
    private String tags;

    @Column
    private UUID authorId;

    @Column
    private UUID reviewerId;

    @Column
    private UUID publishedBy;

    @Column
    private Integer views;

    @Column
    private Integer helpfulVotes;

    public enum ArticleStatus {
        DRAFT, UNDER_REVIEW, PUBLISHED, ARCHIVED
    }
}
