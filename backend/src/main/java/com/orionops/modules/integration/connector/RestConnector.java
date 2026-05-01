package com.orionops.modules.integration.connector;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.reactor.circuitbreaker.operator.CircuitBreakerOperator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.Map;

/**
 * REST API connector for outbound HTTP calls with circuit breaker protection.
 *
 * <p>Provides a unified interface for making REST API calls to external systems
 * with support for multiple authentication strategies (OAuth2, API Key, Basic Auth),
 * configurable timeouts, automatic retries, and circuit breaker protection
 * via Resilience4j.</p>
 */
@Slf4j
@Component
public class RestConnector {

    private final WebClient webClient;
    private final CircuitBreaker circuitBreaker;

    public RestConnector(WebClient connectorWebClient, CircuitBreakerRegistry circuitBreakerRegistry) {
        this.webClient = connectorWebClient;
        this.circuitBreaker = circuitBreakerRegistry.circuitBreaker("restConnector");
    }

    /**
     * Executes an outbound REST API call with circuit breaker protection.
     *
     * @param method  HTTP method (GET, POST, PUT, DELETE, PATCH)
     * @param url     target URL
     * @param headers additional HTTP headers
     * @param body    request body (null for GET/DELETE)
     * @return ConnectorResponse with status code, body, and headers
     */
    public ConnectorResponse execute(HttpMethod method, String url,
                                      Map<String, String> headers, Object body) {
        return execute(method, url, headers, body, AuthConfig.noAuth(), Duration.ofSeconds(30));
    }

    /**
     * Executes an outbound REST API call with full configuration.
     *
     * @param method      HTTP method
     * @param url         target URL
     * @param headers     additional HTTP headers
     * @param body        request body
     * @param authConfig  authentication configuration
     * @param timeout     request timeout
     * @return ConnectorResponse with status code, body, and headers
     */
    public ConnectorResponse execute(HttpMethod method, String url,
                                      Map<String, String> headers, Object body,
                                      AuthConfig authConfig, Duration timeout) {
        log.info("Executing REST call: {} {} (timeout={}s)", method, url, timeout.getSeconds());

        try {
            WebClient.RequestBodySpec requestSpec = webClient.method(method)
                    .uri(url)
                    .headers(h -> applyHeaders(h, headers, authConfig));

            String responseBody;
            if (body != null && (method == HttpMethod.POST || method == HttpMethod.PUT
                    || method == HttpMethod.PATCH)) {
                responseBody = requestSpec
                        .bodyValue(body)
                        .retrieve()
                        .bodyToMono(String.class)
                        .timeout(timeout)
                        .transform(CircuitBreakerOperator.of(circuitBreaker))
                        .block();
            } else {
                responseBody = requestSpec
                        .retrieve()
                        .bodyToMono(String.class)
                        .timeout(timeout)
                        .transform(CircuitBreakerOperator.of(circuitBreaker))
                        .block();
            }

            log.info("REST call completed: {} {} - success", method, url);
            return ConnectorResponse.builder()
                    .statusCode(200)
                    .body(responseBody)
                    .success(true)
                    .build();

        } catch (WebClientResponseException e) {
            log.error("REST call failed: {} {} - status={}, body={}",
                    method, url, e.getStatusCode(), e.getResponseBodyAsString());
            return ConnectorResponse.builder()
                    .statusCode(e.getStatusCode().value())
                    .body(e.getResponseBodyAsString())
                    .success(false)
                    .errorMessage(e.getMessage())
                    .build();
        } catch (Exception e) {
            log.error("REST call failed: {} {} - error={}", method, url, e.getMessage());
            return ConnectorResponse.builder()
                    .statusCode(0)
                    .success(false)
                    .errorMessage(e.getMessage())
                    .build();
        }
    }

    /**
     * Executes a GET request with OAuth2 bearer token authentication.
     */
    public ConnectorResponse getWithOAuth2(String url, String accessToken, Map<String, String> headers) {
        AuthConfig authConfig = AuthConfig.oauth2(accessToken);
        return execute(HttpMethod.GET, url, headers, null, authConfig, Duration.ofSeconds(30));
    }

    /**
     * Executes a GET request with API key authentication.
     */
    public ConnectorResponse getWithApiKey(String url, String apiKey, String headerName,
                                            Map<String, String> headers) {
        AuthConfig authConfig = AuthConfig.apiKey(apiKey, headerName);
        return execute(HttpMethod.GET, url, headers, null, authConfig, Duration.ofSeconds(30));
    }

    /**
     * Executes a POST request with Basic authentication.
     */
    public ConnectorResponse postWithBasicAuth(String url, String username, String password,
                                                Object body, Map<String, String> headers) {
        AuthConfig authConfig = AuthConfig.basic(username, password);
        return execute(HttpMethod.POST, url, headers, body, authConfig, Duration.ofSeconds(30));
    }

    private void applyHeaders(HttpHeaders httpHeaders, Map<String, String> customHeaders, AuthConfig authConfig) {
        httpHeaders.setContentType(MediaType.APPLICATION_JSON);
        httpHeaders.setAccept(java.util.List.of(MediaType.APPLICATION_JSON));

        if (customHeaders != null) {
            customHeaders.forEach(httpHeaders::set);
        }

        switch (authConfig.getType()) {
            case OAUTH2 -> httpHeaders.setBearerAuth(authConfig.getToken());
            case API_KEY -> httpHeaders.set(authConfig.getApiKeyHeader(), authConfig.getApiKeyValue());
            case BASIC -> httpHeaders.setBasicAuth(authConfig.getUsername(), authConfig.getPassword());
            case NONE -> { /* no auth headers */ }
        }
    }

    // ---- Inner DTOs ----

    /**
     * Authentication configuration for outbound REST calls.
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class AuthConfig {
        public enum AuthType { OAUTH2, API_KEY, BASIC, NONE }

        @lombok.Builder.Default
        private AuthType type = AuthType.NONE;
        private String token;
        private String apiKeyHeader;
        private String apiKeyValue;
        private String username;
        private String password;

        public static AuthConfig noAuth() {
            return AuthConfig.builder().type(AuthType.NONE).build();
        }

        public static AuthConfig oauth2(String accessToken) {
            return AuthConfig.builder().type(AuthType.OAUTH2).token(accessToken).build();
        }

        public static AuthConfig apiKey(String key, String headerName) {
            return AuthConfig.builder().type(AuthType.API_KEY).apiKeyValue(key).apiKeyHeader(headerName).build();
        }

        public static AuthConfig basic(String user, String pass) {
            return AuthConfig.builder().type(AuthType.BASIC).username(user).password(pass).build();
        }
    }

    /**
     * Response DTO for connector calls.
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ConnectorResponse {
        private int statusCode;
        private String body;
        private boolean success;
        private String errorMessage;
    }
}
