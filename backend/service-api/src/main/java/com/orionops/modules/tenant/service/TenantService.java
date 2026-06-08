package com.orionops.modules.tenant.service;

import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.modules.tenant.dto.TenantDTO;
import com.orionops.modules.tenant.entity.Subscription;
import com.orionops.modules.tenant.entity.Tenant;
import com.orionops.modules.tenant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository.TenantEntityRepository tenantRepository;
    private final TenantRepository.SubscriptionRepository subscriptionRepository;
    private final TenantRepository.PlanRepository planRepository;

    @Transactional
    public TenantDTO.TenantResponse provisionTenant(TenantDTO.CreateTenantRequest req) {
        log.info("Provisioning new tenant: name={}, slug={}", req.getName(), req.getSlug());
        Tenant tenant = Tenant.builder()
                .name(req.getName()).slug(req.getSlug()).description(req.getDescription())
                .domain(req.getDomain()).logoUrl(req.getLogoUrl())
                .primaryContactEmail(req.getPrimaryContactEmail())
                .status(Tenant.TenantStatus.TRIAL)
                .build();
        tenant.setTenantId(UUID.fromString("00000000-0000-0000-0000-000000000000")); // System-level
        Tenant saved = tenantRepository.save(tenant);

        if (req.getPlanId() != null) {
            Subscription sub = Subscription.builder()
                    .tenantEntityId(saved.getId()).planId(req.getPlanId())
                    .status(Subscription.SubscriptionStatus.TRIAL)
                    .startDate(LocalDateTime.now())
                    .trialEnd(LocalDateTime.now().plusDays(14))
                    .build();
            sub.setTenantId(saved.getId());
            subscriptionRepository.save(sub);
        }
        return mapTenant(saved);
    }

    @Transactional(readOnly = true)
    public TenantDTO.TenantResponse getTenant(UUID id) {
        return mapTenant(findTenantOrThrow(id));
    }

    @Transactional(readOnly = true)
    public java.util.List<TenantDTO.TenantResponse> listTenants() {
        return tenantRepository.findAll().stream()
                .filter(t -> !t.isDeleted())
                .map(this::mapTenant).collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public TenantDTO.TenantResponse updateTenant(UUID id, TenantDTO.CreateTenantRequest req) {
        Tenant tenant = findTenantOrThrow(id);
        tenant.setName(req.getName());
        tenant.setSlug(req.getSlug());
        tenant.setDescription(req.getDescription());
        tenant.setDomain(req.getDomain());
        tenant.setLogoUrl(req.getLogoUrl());
        tenant.setPrimaryContactEmail(req.getPrimaryContactEmail());
        return mapTenant(tenantRepository.save(tenant));
    }

    @Transactional
    public void deleteTenant(UUID id) {
        Tenant tenant = findTenantOrThrow(id);
        tenant.softDelete();
        tenantRepository.save(tenant);
    }

    @Transactional(readOnly = true)
    public TenantDTO.SubscriptionResponse getSubscription(UUID tenantId) {
        Subscription sub = subscriptionRepository.findByTenantEntityIdAndDeletedAtIsNull(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription", tenantId));
        String planName = planRepository.findById(sub.getPlanId())
                .map(p -> p.getName()).orElse("Unknown");
        return mapSubscription(sub, planName);
    }

    @Transactional
    public void handleStripeWebhook(Map<String, Object> payload) {
        String type = (String) payload.get("type");
        log.info("Processing Stripe webhook: type={}", type);

        if ("customer.subscription.updated".equals(type)) {
            Map<String, Object> data = (Map<String, Object>) payload.get("data");
            // Process subscription update
            log.info("Subscription updated from Stripe");
        } else if ("invoice.payment_succeeded".equals(type)) {
            log.info("Payment succeeded from Stripe");
        } else if ("customer.subscription.deleted".equals(type)) {
            log.info("Subscription cancelled from Stripe");
        }
    }

    private Tenant findTenantOrThrow(UUID id) {
        return tenantRepository.findById(id)
                .filter(t -> !t.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", id));
    }

    private TenantDTO.TenantResponse mapTenant(Tenant t) {
        return TenantDTO.TenantResponse.builder().id(t.getId()).name(t.getName())
                .slug(t.getSlug()).description(t.getDescription()).domain(t.getDomain())
                .logoUrl(t.getLogoUrl()).primaryContactEmail(t.getPrimaryContactEmail())
                .status(t.getStatus().name()).stripeCustomerId(t.getStripeCustomerId())
                .createdAt(t.getCreatedAt()).build();
    }

    private TenantDTO.SubscriptionResponse mapSubscription(Subscription s, String planName) {
        return TenantDTO.SubscriptionResponse.builder().id(s.getId())
                .tenantEntityId(s.getTenantEntityId()).planId(s.getPlanId())
                .planName(planName).status(s.getStatus().name())
                .startDate(s.getStartDate()).endDate(s.getEndDate())
                .trialEnd(s.getTrialEnd()).createdAt(s.getCreatedAt()).build();
    }
}
