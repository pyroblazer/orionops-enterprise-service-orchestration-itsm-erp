package com.orionops.modules.cmdb.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CIRelationshipResponse {

    private UUID id;
    private UUID sourceCiId;
    private UUID targetCiId;
    private String relationshipType;
    private String description;
    private String sourceCiName;
    private String targetCiName;
}
