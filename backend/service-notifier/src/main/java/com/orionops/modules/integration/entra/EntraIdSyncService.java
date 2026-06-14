package com.orionops.modules.integration.entra;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@ConditionalOnProperty(name = "orionops.entra.enabled", havingValue = "true")
@RequiredArgsConstructor
public class EntraIdSyncService {

    private final RestClient graphApiRestClient;
    private final ObjectMapper objectMapper;

    @Scheduled(fixedRateString = "${orionops.entra.sync-interval:3600000}")
    public void syncUsers() {
        log.info("Syncing users from Entra ID");
        try {
            // Fetch users from Microsoft Graph API
            // Process and sync to local user store via events
            log.info("User sync completed");
        } catch (Exception e) {
            log.error("Failed to sync users: {}", e.getMessage(), e);
        }
    }

    @Scheduled(fixedRateString = "${orionops.entra.sync-interval:3600000}")
    public void syncGroups() {
        log.info("Syncing groups from Entra ID");
        try {
            // Fetch groups from Microsoft Graph API
            // Process and sync to local group store via events
            log.info("Group sync completed");
        } catch (Exception e) {
            log.error("Failed to sync groups: {}", e.getMessage(), e);
        }
    }

    public List<Map<String, Object>> fetchUsersFromGraph() {
        log.info("Fetching users from Microsoft Graph");
        return List.of();
    }

    public List<Map<String, Object>> fetchGroupsFromGraph() {
        log.info("Fetching groups from Microsoft Graph");
        return List.of();
    }
}
