package com.orionops.modules.search.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchRequest {

    private String query;
    private List<String> entityTypes;
    private UUID tenantId;
    private int page;
    @Builder.Default
    private int size = 20;
}
