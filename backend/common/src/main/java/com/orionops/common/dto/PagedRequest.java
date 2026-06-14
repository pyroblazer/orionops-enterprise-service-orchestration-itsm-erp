package com.orionops.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Pagination and sorting request parameters.
 * Used as a base class or parameter object for all paginated list endpoints.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PagedRequest {

    @Builder.Default
    private int page = 0;

    @Builder.Default
    private int size = 20;

    @Builder.Default
    private String sort = "createdAt";

    @Builder.Default
    private String direction = "DESC";
}
