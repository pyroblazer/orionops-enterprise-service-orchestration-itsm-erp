package com.orionops.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.OAuthFlow;
import io.swagger.v3.oas.models.security.OAuthFlows;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Springdoc OpenAPI / Swagger UI configuration for OrionOps API documentation.
 *
 * <p>Configures OAuth2 bearer token authentication via Keycloak so that
 * developers can authorize directly in Swagger UI and test secured endpoints.</p>
 */
@Configuration
public class OpenApiConfig {

    @Value("${keycloak.auth-server-url}")
    private String keycloakAuthServerUrl;

    @Value("${keycloak.realm}")
    private String keycloakRealm;

    @Bean
    public OpenAPI orionOpsOpenAPI() {
        final String securitySchemeName = "orionops-oauth2";
        String tokenUrl = keycloakAuthServerUrl + "/realms/" + keycloakRealm
            + "/protocol/openid-connect/token";
        String authUrl = keycloakAuthServerUrl + "/realms/" + keycloakRealm
            + "/protocol/openid-connect/auth";

        return new OpenAPI()
            .info(new Info()
                .title("OrionOps API")
                .description(
                    "Enterprise Service Orchestration Platform - REST API. " +
                    "ISO 20000-aligned ITSM with BPMN workflow orchestration, " +
                    "SLA management, and ERP extensions."
                )
                .version("0.1.0")
                .contact(new Contact()
                    .name("OrionOps Engineering")
                    .email("engineering@orionops.io"))
                .license(new License()
                    .name("Proprietary")
                    .url("https://orionops.io/license"))
            )
            .servers(List.of(
                new Server()
                    .url("/api")
                    .description("Current environment")
            ))
            .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
            .components(new Components()
                .addSecuritySchemes(securitySchemeName, new SecurityScheme()
                    .name(securitySchemeName)
                    .type(SecurityScheme.Type.OAUTH2)
                    .flows(new OAuthFlows()
                        .authorizationCode(new OAuthFlow()
                            .authorizationUrl(authUrl)
                            .tokenUrl(tokenUrl)
                            .scopes(new io.swagger.v3.oas.models.security.Scopes()))
                    )
                    .in(SecurityScheme.In.HEADER)
                )
            );
    }
}
