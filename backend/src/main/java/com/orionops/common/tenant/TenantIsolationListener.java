package com.orionops.common.tenant;

import com.orionops.common.auditing.BaseEntity;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.PostLoad;
import lombok.extern.slf4j.Slf4j;

/**
 * JPA entity listener that blocks cross-tenant reads.
 *
 * <p>Services look up single records with {@code findById(id)}, which is not tenant scoped.
 * This listener runs after every entity is loaded: when the current request carries a tenant
 * (resolved from the JWT) and the loaded row belongs to a different tenant, loading fails as if
 * the row did not exist. System/async work without a tenant context is unaffected.</p>
 */
@Slf4j
public class TenantIsolationListener {

    @PostLoad
    void enforceTenant(Object entity) {
        if (!(entity instanceof BaseEntity base) || !TenantContextHolder.hasTenant()) {
            return;
        }
        if (base.getTenantId() != null && !base.getTenantId().equals(TenantContextHolder.getCurrentTenantId())) {
            log.warn("Blocked cross-tenant access to {} id={}", entity.getClass().getSimpleName(), base.getId());
            throw new EntityNotFoundException(entity.getClass().getSimpleName() + " not found");
        }
    }
}
