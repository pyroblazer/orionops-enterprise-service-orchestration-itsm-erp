package com.orionops.common.tenant;

import java.util.UUID;

/**
 * ThreadLocal holder for the current tenant ID.
 *
 * <p>Populated by {@link TenantResolutionFilter} on each request from the
 * Keycloak JWT's {@code tenant_id} claim. All services should call
 * {@link #getCurrentTenantId()} instead of hardcoding a fallback UUID.</p>
 *
 * <p>The context is cleared automatically at the end of each request by the
 * filter to prevent tenant leakage across threads.</p>
 */
public final class TenantContextHolder {

    private static final ThreadLocal<UUID> TENANT_CONTEXT = new ThreadLocal<>();

    /** Default sandbox tenant used when no JWT is present (e.g. system/async operations). */
    public static final UUID DEFAULT_TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");

    private TenantContextHolder() {}

    /**
     * Sets the tenant ID for the current thread.
     */
    public static void setCurrentTenantId(UUID tenantId) {
        TENANT_CONTEXT.set(tenantId);
    }

    /**
     * Returns the tenant ID for the current thread, or the default sandbox tenant
     * if none has been set.
     */
    public static UUID getCurrentTenantId() {
        UUID tenantId = TENANT_CONTEXT.get();
        return tenantId != null ? tenantId : DEFAULT_TENANT;
    }

    /**
     * Returns true if a tenant ID has been explicitly set on this thread.
     */
    public static boolean hasTenant() {
        return TENANT_CONTEXT.get() != null;
    }

    /**
     * Clears the tenant ID for the current thread.
     * Must be called at the end of each request to prevent cross-request leakage.
     */
    public static void clear() {
        TENANT_CONTEXT.remove();
    }
}
