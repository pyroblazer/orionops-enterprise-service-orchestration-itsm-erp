package com.orionops.modules.cmdb.dto;

import com.orionops.modules.cmdb.entity.ConfigurationItem;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CIRequest {

    @NotBlank(message = "Name is required")
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
}
