package com.orionops.modules.tenant.repository;

import com.orionops.modules.tenant.entity.Plan;
import com.orionops.modules.tenant.entity.Subscription;
import com.orionops.modules.tenant.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

public class TenantRepository {

    @Repository
    public interface TenantEntityRepository extends JpaRepository<Tenant, UUID> {
        Optional<Tenant> findBySlug(String slug);
        Optional<Tenant> findByStripeCustomerId(String stripeCustomerId);
    }

    @Repository
    public interface PlanRepository extends JpaRepository<Plan, UUID> {
    }

    @Repository
    public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {
        Optional<Subscription> findByTenantEntityIdAndDeletedAtIsNull(UUID tenantEntityId);
    }
}
