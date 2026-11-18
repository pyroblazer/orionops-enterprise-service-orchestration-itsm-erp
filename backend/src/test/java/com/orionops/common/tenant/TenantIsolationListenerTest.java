package com.orionops.common.tenant;

import com.orionops.common.auditing.BaseEntity;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TenantIsolationListenerTest {

    private static final UUID TENANT_A = UUID.fromString("00000000-0000-0000-0000-00000000000a");
    private static final UUID TENANT_B = UUID.fromString("00000000-0000-0000-0000-00000000000b");

    private final TenantIsolationListener listener = new TenantIsolationListener();

    private static class TestEntity extends BaseEntity {
    }

    private static TestEntity entityOf(UUID tenantId) {
        TestEntity entity = new TestEntity();
        entity.setTenantId(tenantId);
        return entity;
    }

    @AfterEach
    void clearContext() {
        TenantContextHolder.clear();
    }

    @Test
    void blocksEntityFromAnotherTenant() {
        TenantContextHolder.setCurrentTenantId(TENANT_A);
        assertThrows(EntityNotFoundException.class, () -> listener.enforceTenant(entityOf(TENANT_B)));
    }

    @Test
    void allowsEntityFromSameTenant() {
        TenantContextHolder.setCurrentTenantId(TENANT_A);
        assertDoesNotThrow(() -> listener.enforceTenant(entityOf(TENANT_A)));
    }

    @Test
    void ignoresSystemWorkWithoutTenantContext() {
        assertDoesNotThrow(() -> listener.enforceTenant(entityOf(TENANT_B)));
    }
}
