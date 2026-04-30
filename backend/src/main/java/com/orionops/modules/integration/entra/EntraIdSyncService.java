package com.orionops.modules.integration.entra;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.orionops.modules.auth.entity.User;
import com.orionops.modules.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Service for synchronizing users and groups from Microsoft Entra ID (Azure AD).
 *
 * <p>Uses the Microsoft Graph API to fetch users and groups, then synchronizes
 * them to the local User table. Handles OAuth2 client credentials authentication,
 * pagination via @odata.nextLink, and incremental sync logic.</p>
 *
 * <p>Synchronization runs on a scheduled basis (hourly by default) and can
 * also be triggered manually via the syncUsers() and syncGroups() methods.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EntraIdSyncService {

    private final RestClient graphApiRestClient;
    private final UserRepository userRepository;
    private final EntraIdConfig.EntraIdProperties entraProperties;
    private final ObjectMapper objectMapper;

    /**
     * Cached OAuth2 access token for Microsoft Graph API.
     * Uses AtomicReference for thread-safe publication of the token pair
     * between the scheduled sync thread and manual API call threads.
     */
    private final AtomicReference<TokenHolder> tokenHolder = new AtomicReference<>(new TokenHolder(null, 0));
    private final ReentrantLock syncLock = new ReentrantLock();

    private record TokenHolder(String accessToken, long expiresAtEpochMs) {
        boolean isExpired() {
            return accessToken == null || System.currentTimeMillis() >= expiresAtEpochMs;
        }
    }

    /**
     * Scheduled hourly synchronization of users and groups from Entra ID.
     * Runs at the top of every hour when Entra ID integration is enabled.
     */
    @Scheduled(cron = "0 0 * * * *")
    public void scheduledSync() {
        if (!entraProperties.isEnabled()) {
            log.debug("Entra ID sync is disabled, skipping scheduled sync");
            return;
        }

        if (!syncLock.tryLock()) {
            log.warn("Entra ID sync already in progress, skipping scheduled invocation");
            return;
        }

        try {
            log.info("Starting scheduled Entra ID synchronization");
            SyncResult userResult = syncUsers();
            SyncResult groupResult = syncGroups();
            log.info("Entra ID sync complete: users={}, groups={}", userResult, groupResult);
        } catch (Exception e) {
            log.error("Entra ID scheduled sync failed: {}", e.getMessage(), e);
        } finally {
            syncLock.unlock();
        }
    }

    /**
     * Synchronizes users from Microsoft Entra ID via Microsoft Graph API.
     *
     * <p>Calls the /users endpoint, handles pagination with @odata.nextLink,
     * and maps each Graph user to the local User entity. Existing users are
     * updated (matched by keycloakId field), new users are created.</p>
     *
     * @return sync result with counts of created, updated, and skipped users
     */
    @Transactional
    public SyncResult syncUsers() {
        if (!entraProperties.isEnabled()) {
            log.warn("Entra ID sync is disabled");
            return SyncResult.empty("users");
        }

        log.info("Starting Entra ID user synchronization");
        String token = getAccessToken();
        int created = 0;
        int updated = 0;
        int skipped = 0;
        int errors = 0;

        try {
            String url = "/users?$select=id,displayName,givenName,surname,mail,userPrincipalName,"
                    + "jobTitle,department,officeLocation,mobilePhone,accountEnabled,createdDateTime";

            while (url != null) {
                String responseBody = graphApiRestClient.get()
                        .uri(url)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .retrieve()
                        .body(String.class);

                JsonNode responseJson = objectMapper.readTree(responseBody);
                JsonNode valueArray = responseJson.get("value");

                if (valueArray == null || !valueArray.isArray()) {
                    log.warn("No value array in Graph API response");
                    break;
                }

                for (JsonNode graphUser : valueArray) {
                    try {
                        User mappedUser = mapGraphUser(graphUser);

                        // Skip disabled users if configured
                        if (!entraProperties.isSyncDisabledUsers()) {
                            JsonNode accountEnabled = graphUser.get("accountEnabled");
                            if (accountEnabled != null && !accountEnabled.asBoolean(true)) {
                                skipped++;
                                continue;
                            }
                        }

                        // Check if user already exists by keycloakId (maps to Entra ID object ID)
                        var existingUser = userRepository.findByKeycloakId(mappedUser.getKeycloakId());

                        if (existingUser.isPresent()) {
                            User existing = existingUser.get();
                            updateLocalUser(existing, mappedUser);
                            userRepository.save(existing);
                            updated++;
                        } else {
                            // Check for duplicate email
                            if (mappedUser.getEmail() != null
                                    && userRepository.existsByEmail(mappedUser.getEmail())) {
                                log.warn("User with email {} already exists with different Entra ID, skipping",
                                        mappedUser.getEmail());
                                skipped++;
                                continue;
                            }
                            userRepository.save(mappedUser);
                            created++;
                        }

                    } catch (Exception e) {
                        errors++;
                        log.error("Failed to sync Entra ID user: {}", e.getMessage(), e);
                    }
                }

                // Handle pagination: follow @odata.nextLink
                JsonNode nextLink = responseJson.get("@odata.nextLink");
                url = (nextLink != null && !nextLink.isNull()) ? nextLink.asText() : null;

                // Convert full URLs to relative paths for our RestClient
                if (url != null && url.startsWith(entraProperties.getGraphBaseUrl())) {
                    url = url.substring(entraProperties.getGraphBaseUrl().length());
                }
            }

        } catch (Exception e) {
            log.error("Failed to sync users from Entra ID: {}", e.getMessage(), e);
            throw new RuntimeException("Entra ID user sync failed", e);
        }

        SyncResult result = new SyncResult("users", created, updated, skipped, errors);
        log.info("User sync complete: {}", result);
        return result;
    }

    /**
     * Synchronizes groups and their memberships from Microsoft Entra ID.
     *
     * <p>Calls the /groups endpoint, handles pagination, and for each group
     * fetches its members. Groups are stored as user group memberships
     * on the local User entity.</p>
     *
     * @return sync result with counts
     */
    @Transactional
    public SyncResult syncGroups() {
        if (!entraProperties.isEnabled()) {
            log.warn("Entra ID sync is disabled");
            return SyncResult.empty("groups");
        }

        log.info("Starting Entra ID group synchronization");
        String token = getAccessToken();
        int created = 0;
        int updated = 0;
        int skipped = 0;
        int errors = 0;

        try {
            String url = "/groups?$select=id,displayName,description,mailNickname,securityEnabled";

            while (url != null) {
                String responseBody = graphApiRestClient.get()
                        .uri(url)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .retrieve()
                        .body(String.class);

                JsonNode responseJson = objectMapper.readTree(responseBody);
                JsonNode valueArray = responseJson.get("value");

                if (valueArray == null || !valueArray.isArray()) {
                    break;
                }

                for (JsonNode graphGroup : valueArray) {
                    try {
                        String groupId = graphGroup.get("id").asText();
                        String groupName = graphGroup.get("displayName").asText();

                        log.debug("Processing group: {} ({})", groupName, groupId);

                        // Fetch group members
                        syncGroupMembers(groupId, groupName, token);

                        updated++;

                    } catch (Exception e) {
                        errors++;
                        log.error("Failed to sync group: {}", e.getMessage(), e);
                    }
                }

                // Handle pagination
                JsonNode nextLink = responseJson.get("@odata.nextLink");
                url = (nextLink != null && !nextLink.isNull()) ? nextLink.asText() : null;

                if (url != null && url.startsWith(entraProperties.getGraphBaseUrl())) {
                    url = url.substring(entraProperties.getGraphBaseUrl().length());
                }
            }

        } catch (Exception e) {
            log.error("Failed to sync groups from Entra ID: {}", e.getMessage(), e);
            throw new RuntimeException("Entra ID group sync failed", e);
        }

        SyncResult result = new SyncResult("groups", created, updated, skipped, errors);
        log.info("Group sync complete: {}", result);
        return result;
    }

    /**
     * Synchronizes members of a specific Entra ID group to the local user groups.
     *
     * @param groupId   the Entra ID group object ID
     * @param groupName the display name of the group
     * @param token     the OAuth2 access token
     */
    private void syncGroupMembers(String groupId, String groupName, String token) {
        try {
            String membersUrl = "/groups/" + groupId + "/members?$select=id";
            String membersResponse = graphApiRestClient.get()
                    .uri(membersUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .retrieve()
                    .body(String.class);

            JsonNode membersJson = objectMapper.readTree(membersResponse);
            JsonNode membersArray = membersJson.get("value");

            if (membersArray == null || !membersArray.isArray()) {
                return;
            }

            for (JsonNode member : membersArray) {
                String memberId = member.get("id").asText();

                var userOpt = userRepository.findByKeycloakId(memberId);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    Set<String> groups = user.getGroups();
                    if (groups == null) {
                        groups = new HashSet<>();
                        user.setGroups(groups);
                    }
                    if (groups.add(groupName)) {
                        userRepository.save(user);
                        log.debug("Added group '{}' to user {}", groupName, user.getUsername());
                    }
                }
            }

        } catch (Exception e) {
            log.error("Failed to sync members for group {}: {}", groupId, e.getMessage(), e);
        }
    }

    /**
     * Maps a Microsoft Graph user object to a local User entity.
     *
     * <p>Maps the following fields:
     * - id (Graph) -> keycloakId (local) - uses the Entra ID object ID as the unique identifier
     * - userPrincipalName -> username
     * - mail -> email
     * - givenName -> firstName
     * - surname -> lastName
     * - department -> department
     * - mobilePhone -> phone
     * - accountEnabled -> active
     * </p>
     *
     * @param graphUser the JSON node representing a Microsoft Graph user
     * @return mapped User entity
     */
    public User mapGraphUser(JsonNode graphUser) {
        String entraId = getTextOrNull(graphUser, "id");
        String displayName = getTextOrNull(graphUser, "displayName");
        String givenName = getTextOrNull(graphUser, "givenName");
        String surname = getTextOrNull(graphUser, "surname");
        String mail = getTextOrNull(graphUser, "mail");
        String upn = getTextOrNull(graphUser, "userPrincipalName");
        String department = getTextOrNull(graphUser, "department");
        String mobilePhone = getTextOrNull(graphUser, "mobilePhone");

        JsonNode accountEnabledNode = graphUser.get("accountEnabled");
        boolean accountEnabled = accountEnabledNode == null || accountEnabledNode.asBoolean(true);

        // Use UPN as username, fall back to mail, then to displayName
        String username = upn;
        if (username == null) {
            username = mail;
        }
        if (username == null) {
            username = displayName;
        }

        return User.builder()
                .keycloakId(entraId)
                .username(username != null ? username : "unknown-" + entraId)
                .email(mail != null ? mail : "")
                .firstName(givenName)
                .lastName(surname)
                .department(department)
                .phone(mobilePhone)
                .active(accountEnabled)
                .roles(new HashSet<>())
                .groups(new HashSet<>())
                .tenantId(UUID.fromString("00000000-0000-0000-0000-000000000000"))
                .build();
    }

    // ---- Private helpers ----

    /**
     * Updates an existing local user with values from the Entra ID mapped user.
     * Only overwrites fields that are non-null in the mapped user.
     */
    private void updateLocalUser(User existing, User mapped) {
        if (mapped.getEmail() != null) {
            existing.setEmail(mapped.getEmail());
        }
        if (mapped.getFirstName() != null) {
            existing.setFirstName(mapped.getFirstName());
        }
        if (mapped.getLastName() != null) {
            existing.setLastName(mapped.getLastName());
        }
        if (mapped.getDepartment() != null) {
            existing.setDepartment(mapped.getDepartment());
        }
        if (mapped.getPhone() != null) {
            existing.setPhone(mapped.getPhone());
        }
        existing.setActive(mapped.isActive());
    }

    /**
     * Obtains an OAuth2 access token using the client credentials flow.
     * Caches the token and refreshes it when it nears expiration.
     *
     * @return a valid OAuth2 access token
     */
    private String getAccessToken() {
        TokenHolder current = tokenHolder.get();
        if (!current.isExpired()) {
            return current.accessToken();
        }

        syncLock.lock();
        try {
            // Double-check after acquiring lock
            current = tokenHolder.get();
            if (!current.isExpired()) {
                return current.accessToken();
            }

            log.info("Requesting new OAuth2 access token for Microsoft Graph API");

            MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
            formData.add("client_id", entraProperties.getClientId());
            formData.add("client_secret", entraProperties.getClientSecret());
            formData.add("scope", entraProperties.getScope());
            formData.add("grant_type", "client_credentials");

            String response = graphApiRestClient.post()
                    .uri(entraProperties.getTokenEndpoint())
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(formData)
                    .retrieve()
                    .body(String.class);

            JsonNode tokenResponse = objectMapper.readTree(response);
            String newToken = tokenResponse.get("access_token").asText();
            int expiresIn = tokenResponse.has("expires_in")
                    ? tokenResponse.get("expires_in").asInt()
                    : 3600;
            long expiresAt = System.currentTimeMillis() + ((long) expiresIn - 60) * 1000;

            tokenHolder.set(new TokenHolder(newToken, expiresAt));
            log.info("OAuth2 access token obtained, expires in {} seconds", expiresIn);
            return newToken;

        } catch (Exception e) {
            log.error("Failed to obtain OAuth2 access token: {}", e.getMessage(), e);
            throw new RuntimeException("Entra ID OAuth2 token acquisition failed", e);
        } finally {
            syncLock.unlock();
        }
    }

    /**
     * Safely extracts a text value from a JSON node, returning null if the field is missing.
     */
    private String getTextOrNull(JsonNode node, String fieldName) {
        JsonNode field = node.get(fieldName);
        return (field != null && !field.isNull()) ? field.asText() : null;
    }

    // ---- DTO ----

    /**
     * Result of a synchronization operation.
     */
    @lombok.Data
    @lombok.AllArgsConstructor
    @lombok.NoArgsConstructor
    public static class SyncResult {
        private String entityType;
        private int created;
        private int updated;
        private int skipped;
        private int errors;

        public static SyncResult empty(String entityType) {
            return new SyncResult(entityType, 0, 0, 0, 0);
        }

        @Override
        public String toString() {
            return String.format("SyncResult[%s: created=%d, updated=%d, skipped=%d, errors=%d]",
                    entityType, created, updated, skipped, errors);
        }
    }
}
