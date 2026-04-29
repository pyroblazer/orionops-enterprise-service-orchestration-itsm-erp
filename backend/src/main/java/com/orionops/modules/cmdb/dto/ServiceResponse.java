package com.orionops.modules.cmdb.dto;

import com.orionops.modules.cmdb.entity.Service;
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
public class ServiceResponse {

    private UUID id;
    private String name;
    private String description;
    private Service.ServiceStatus status;
    private String owner;
    private String supportGroup;
    private String category;
    private UUID tenantId;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
