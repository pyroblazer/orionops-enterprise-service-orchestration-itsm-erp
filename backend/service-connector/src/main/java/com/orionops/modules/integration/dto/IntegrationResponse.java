package com.orionops.modules.integration.dto;

import com.orionops.modules.integration.entity.IntegrationEndpoint;
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
public class IntegrationResponse {

    private UUID id;
    private String name;
    private String description;
    private IntegrationEndpoint.IntegrationType type;
    private String url;
    private String method;
    private IntegrationEndpoint.IntegrationStatus status;
    private boolean verifySsl;
    private Integer timeoutSeconds;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
