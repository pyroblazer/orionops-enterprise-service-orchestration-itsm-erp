package com.orionops.modules.integration.entra;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Slf4j
@Service
@ConditionalOnProperty(name = "orionops.entra.enabled", havingValue = "true")
@RequiredArgsConstructor
public class EntraIdSyncService {

    private final RestClient graphApiRestClient;
    private final ObjectMapper objectMapper;

    public void syncUsers() {
        log.info("Syncing users from Entra ID");
    }

    public void syncGroups() {
        log.info("Syncing groups from Entra ID");
    }
}
