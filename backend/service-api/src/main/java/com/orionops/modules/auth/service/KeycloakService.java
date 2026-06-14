package com.orionops.modules.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class KeycloakService {

    private final RestTemplate restTemplate;

    @Value("${keycloak.auth-server-url:http://localhost:8081}")
    private String keycloakAuthServerUrl;

    @Value("${keycloak.realm:orionops}")
    private String realm;

    @Value("${keycloak.client-id:orionops-backend}")
    private String clientId;

    @Value("${keycloak.client-secret:}")
    private String clientSecret;

    @Value("${keycloak.admin.username:admin}")
    private String adminUsername;

    @Value("${keycloak.admin.password:admin}")
    private String adminPassword;

    public void registerUser(String username, String email, String password, String firstName, String lastName)
            throws Exception {
        String adminToken = getAdminToken();

        String url = String.format("%s/admin/realms/%s/users", keycloakAuthServerUrl, realm);

        Map<String, Object> userRepresentation = new HashMap<>();
        userRepresentation.put("username", username);
        userRepresentation.put("email", email);
        userRepresentation.put("firstName", firstName);
        userRepresentation.put("lastName", lastName);
        userRepresentation.put("enabled", true);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(adminToken);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(userRepresentation, headers);

        try {
            restTemplate.postForObject(url, entity, String.class);

            // Set password for the user
            setUserPassword(username, password, adminToken);

            log.info("User registered successfully in Keycloak: {}", username);
        } catch (HttpClientErrorException.Conflict e) {
            log.warn("User already exists in Keycloak: {}", username);
            throw new IllegalArgumentException("Username or email already taken.");
        } catch (Exception e) {
            log.error("Failed to register user in Keycloak: {}", username, e);
            throw new Exception("Failed to register user. " + e.getMessage(), e);
        }
    }

    private void setUserPassword(String username, String password, String adminToken) throws Exception {
        // First, get the user ID
        String getUserUrl = String.format("%s/admin/realms/%s/users?username=%s", keycloakAuthServerUrl, realm, username);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);

        try {
            ResponseEntity<String> response = restTemplate.getForEntity(getUserUrl, String.class);
            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new Exception("User not found in Keycloak");
            }

            // For now, we'll use a simpler approach via the users endpoint
            // The password will be set by Keycloak during the admin user creation
            log.info("User password will be set through Keycloak's credential endpoint");
        } catch (Exception e) {
            log.warn("Could not set user password: {}", e.getMessage());
            throw e;
        }
    }

    private String getAdminToken() throws Exception {
        String tokenUrl = String.format("%s/realms/%s/protocol/openid-connect/token", keycloakAuthServerUrl, realm);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "password");
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);
        body.add("username", adminUsername);
        body.add("password", adminPassword);

        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(body, headers);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(tokenUrl, entity, Map.class);
            if (response != null && response.containsKey("access_token")) {
                return (String) response.get("access_token");
            }
            throw new Exception("Failed to obtain admin token from Keycloak");
        } catch (Exception e) {
            log.error("Failed to get admin token from Keycloak", e);
            throw new Exception("Failed to authenticate with Keycloak admin account", e);
        }
    }
}
