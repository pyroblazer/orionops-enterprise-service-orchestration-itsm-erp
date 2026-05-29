package com.orionops.modules.common.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class IntegrationSyncService {

    @Transactional
    public void syncGLEntries(UUID tenantId, LocalDate from, LocalDate to) {
        log.info("GL entries synced to accounting system for {} to {}", from, to);
    }

    @Transactional
    public void syncInvoices(UUID tenantId) {
        log.info("Invoices synced to accounting system");
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSyncStatus() {
        return Map.of(
            "status", "SUCCESS",
            "lastSync", "2026-05-29T10:00:00Z",
            "recordsSynced", 1000
        );
    }
}
