package com.orionops.modules.integration.entra;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;

/**
 * Configuration for Microsoft Entra ID (Azure AD) integration.
 *
 * <p>Configures the REST client for Microsoft Graph API calls with
 * OAuth2 client credentials flow. Properties are bound from the
 * "orionops.integrations.entra" prefix in application configuration.</p>
 *
 * <p>The OAuth2 client credentials flow requires:
 * - client-id: The application (client) ID registered in Entra ID
 * - client-secret: The client secret generated for the application
 * - tenant-id: The Entra ID tenant (directory) ID
 * </p>
 */
@Slf4j
@Configuration
public class EntraIdConfig {

    /**
     * Creates a RestClient bean configured for Microsoft Graph API v1.0.
     *
     * <p>The base URL is set to https://graph.microsoft.com/v1.0.
     * Authentication headers (Bearer token) are added dynamically by
     * the EntraIdSyncService when making requests.</p>
     *
     * @return configured RestClient for Microsoft Graph API
     */
    @Bean
    public RestClient graphApiRestClient(RestClient.Builder restClientBuilder) {
        return restClientBuilder
                .baseUrl("https://graph.microsoft.com/v1.0")
                .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("Accept", MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    /**
     * Configuration properties for Microsoft Entra ID integration.
     *
     * <p>Binds properties from "orionops.integrations.entra" prefix.</p>
     */
    @Data
    @ConfigurationProperties(prefix = "orionops.integrations.entra")
    @org.springframework.context.annotation.Configuration
    public static class EntraIdProperties {

        /**
         * Whether Entra ID synchronization is enabled.
         */
        private boolean enabled = false;

        /**
         * The application (client) ID registered in Microsoft Entra ID.
         */
        private String clientId;

        /**
         * The client secret for the registered application.
         */
        private String clientSecret;

        /**
         * The Microsoft Entra ID tenant (directory) ID.
         */
        private String tenantId;

        /**
         * The scopes for the OAuth2 token request.
         * Defaults to "https://graph.microsoft.com/.default" for client credentials flow.
         */
        private String scope = "https://graph.microsoft.com/.default";

        /**
         * The Graph API base URL. Can be overridden for testing.
         */
        private String graphBaseUrl = "https://graph.microsoft.com/v1.0";

        /**
         * Maximum number of users to sync per batch.
         */
        private int batchSize = 100;

        /**
         * Whether to sync disabled/inactive users from Entra ID.
         */
        private boolean syncDisabledUsers = false;

        /**
         * Builds the OAuth2 token endpoint URL for the configured tenant.
         *
         * @return the token endpoint URL
         */
        public String getTokenEndpoint() {
            return "https://login.microsoftonline.com/" + tenantId + "/oauth2/v2.0/token";
        }
    }
}
