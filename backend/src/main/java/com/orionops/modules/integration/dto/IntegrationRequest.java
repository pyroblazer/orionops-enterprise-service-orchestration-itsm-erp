package com.orionops.modules.integration.dto;

import com.orionops.modules.integration.entity.IntegrationEndpoint;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IntegrationRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private String description;
    private IntegrationEndpoint.IntegrationType type;

    @NotBlank(message = "URL is required")
    private String url;

    private String method;
    private String headers;
    private String authConfig;
    private String payloadTemplate;
    private boolean verifySsl;
    private Integer timeoutSeconds;
}
