package com.orionops.modules.cmdb.dto;

import com.orionops.modules.cmdb.entity.ConfigurationItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CIResponse {

    private UUID id;
    private String name;
    private String description;
    private ConfigurationItem.CIType type;
    private ConfigurationItem.CIStatus status;
    private String environment;
    private String ownerId;
    private String location;
    private String version;
    private UUID parentId;
    private String attributes;
    private UUID tenantId;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<CIRelationshipResponse> relationships;
}
