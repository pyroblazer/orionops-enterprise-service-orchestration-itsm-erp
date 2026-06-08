package com.orionops.modules.audit.dto;

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
public class AuditResponse {

    private UUID id;
    private String action;
    private String entityType;
    private UUID entityId;
    private String performedBy;
    private String description;
    private String oldValue;
    private String newValue;
    private UUID tenantId;
    private LocalDateTime timestamp;
}
