package com.orionops.modules.knowledge.dto;

import com.orionops.modules.knowledge.entity.KnowledgeArticle;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeArticleResponse {

    private UUID id;
    private String title;
    private String content;
    private KnowledgeArticle.ArticleStatus status;
    private String category;
    private String tags;
    private UUID authorId;
    private UUID reviewerId;
    private UUID publishedBy;
    private Integer views;
    private Integer helpfulVotes;
    private UUID tenantId;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
