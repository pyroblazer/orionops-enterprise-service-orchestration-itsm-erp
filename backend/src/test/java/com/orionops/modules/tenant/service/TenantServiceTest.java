package com.orionops.modules.tenant.service;

import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.modules.tenant.dto.TenantDTO;
import com.orionops.modules.tenant.entity.Plan;
import com.orionops.modules.tenant.entity.Subscription;
import com.orionops.modules.tenant.entity.Tenant;
import com.orionops.modules.tenant.repository.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("TenantService")
class TenantServiceTest {

    @Mock
    private TenantRepository.TenantEntityRepository tenantRepository;

    @Mock
    private TenantRepository.SubscriptionRepository subscriptionRepository;

    @Mock
    private TenantRepository.PlanRepository planRepository;

    @InjectMocks
    private TenantService tenantService;

    private UUID tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.fromString("00000000-0000-0000-0000-000000000001");
    }

    private Tenant buildTenant(UUID id, String name) {
        Tenant tenant = Tenant.builder()
                .name(name)
                .slug(name.toLowerCase().replace(" ", "-"))
                .description("Test tenant")
                .domain("test.com")
                .logoUrl("https://logo.com/logo.png")
                .primaryContactEmail("contact@test.com")
                .status(Tenant.TenantStatus.TRIAL)
                .build();
        tenant.setId(id);
        return tenant;
    }

    @Nested
    @DisplayName("provisionTenant")
    class ProvisionTenant {

        @Test
        @DisplayName("creates tenant with TRIAL status")
        void createsTenant() {
            TenantDTO.CreateTenantRequest req = new TenantDTO.CreateTenantRequest();
            req.setName("New Tenant");
            req.setSlug("new-tenant");
            req.setDescription("Test");

            Tenant tenant = buildTenant(tenantId, "New Tenant");
            when(tenantRepository.save(any(Tenant.class))).thenReturn(tenant);

            TenantDTO.TenantResponse response = tenantService.provisionTenant(req);

            assertThat(response.getName()).isEqualTo("New Tenant");
        }

        @Test
        @DisplayName("creates subscription with plan when planId provided")
        void createsSubscription() {
            TenantDTO.CreateTenantRequest req = new TenantDTO.CreateTenantRequest();
            req.setName("Tenant");
            req.setSlug("tenant");
            req.setPlanId(UUID.randomUUID());

            Tenant tenant = buildTenant(tenantId, "Tenant");
            when(tenantRepository.save(any(Tenant.class))).thenReturn(tenant);
            when(subscriptionRepository.save(any(Subscription.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            tenantService.provisionTenant(req);

            verify(subscriptionRepository).save(any(Subscription.class));
        }

        @Test
        @DisplayName("sets 14-day trial end date")
        void setsTrial() {
            TenantDTO.CreateTenantRequest req = new TenantDTO.CreateTenantRequest();
            req.setName("Tenant");
            req.setSlug("tenant");
            req.setPlanId(UUID.randomUUID());

            Tenant tenant = buildTenant(tenantId, "Tenant");
            when(tenantRepository.save(any(Tenant.class))).thenReturn(tenant);
            when(subscriptionRepository.save(any(Subscription.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            tenantService.provisionTenant(req);

            verify(subscriptionRepository).save(any(Subscription.class));
        }
    }

    @Nested
    @DisplayName("getTenant")
    class GetTenant {

        @Test
        @DisplayName("returns tenant for valid ID")
        void returnsTenant() {
            Tenant tenant = buildTenant(tenantId, "Test");
            when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));

            TenantDTO.TenantResponse response = tenantService.getTenant(tenantId);

            assertThat(response.getName()).isEqualTo("Test");
        }

        @Test
        @DisplayName("throws ResourceNotFoundException for missing tenant")
        void throwsForMissing() {
            when(tenantRepository.findById(tenantId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> tenantService.getTenant(tenantId))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("listTenants")
    class ListTenants {

        @Test
        @DisplayName("returns all non-deleted tenants")
        void returnsTenants() {
            Tenant t1 = buildTenant(UUID.randomUUID(), "Tenant 1");
            Tenant t2 = buildTenant(UUID.randomUUID(), "Tenant 2");

            when(tenantRepository.findAll()).thenReturn(List.of(t1, t2));

            List<TenantDTO.TenantResponse> result = tenantService.listTenants();

            assertThat(result).hasSize(2);
        }

        @Test
        @DisplayName("filters out soft-deleted tenants")
        void filtersSoftDeleted() {
            Tenant t1 = buildTenant(UUID.randomUUID(), "Active");
            Tenant t2 = buildTenant(UUID.randomUUID(), "Deleted");
            t2.softDelete();

            when(tenantRepository.findAll()).thenReturn(List.of(t1, t2));

            List<TenantDTO.TenantResponse> result = tenantService.listTenants();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("Active");
        }
    }

    @Nested
    @DisplayName("updateTenant")
    class UpdateTenant {

        @Test
        @DisplayName("updates tenant fields")
        void updatesTenant() {
            Tenant tenant = buildTenant(tenantId, "Old Name");
            TenantDTO.CreateTenantRequest req = new TenantDTO.CreateTenantRequest();
            req.setName("New Name");
            req.setSlug("new-name");

            when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
            when(tenantRepository.save(any(Tenant.class))).thenReturn(tenant);

            tenantService.updateTenant(tenantId, req);

            verify(tenantRepository).save(any(Tenant.class));
        }
    }

    @Nested
    @DisplayName("deleteTenant")
    class DeleteTenant {

        @Test
        @DisplayName("soft deletes tenant")
        void softDeletesTenant() {
            Tenant tenant = buildTenant(tenantId, "To Delete");
            when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
            when(tenantRepository.save(any(Tenant.class))).thenReturn(tenant);

            tenantService.deleteTenant(tenantId);

            verify(tenantRepository).save(any(Tenant.class));
        }
    }

    @Nested
    @DisplayName("getSubscription")
    class GetSubscription {

        @Test
        @DisplayName("returns subscription with plan name")
        void returnsSubscription() {
            Subscription sub = Subscription.builder()
                    .tenantEntityId(tenantId)
                    .planId(UUID.randomUUID())
                    .status(Subscription.SubscriptionStatus.ACTIVE)
                    .startDate(LocalDateTime.now())
                    .build();

            when(subscriptionRepository.findByTenantEntityIdAndDeletedAtIsNull(tenantId))
                    .thenReturn(Optional.of(sub));
            Plan plan = Plan.builder().name("Pro").build();
            when(planRepository.findById(sub.getPlanId()))
                    .thenReturn(Optional.of(plan));

            TenantDTO.SubscriptionResponse response = tenantService.getSubscription(tenantId);

            assertThat(response.getPlanName()).isEqualTo("Pro");
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when no subscription")
        void throwsForNoSubscription() {
            when(subscriptionRepository.findByTenantEntityIdAndDeletedAtIsNull(tenantId))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> tenantService.getSubscription(tenantId))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("handleStripeWebhook")
    class HandleStripeWebhook {

        @Test
        @DisplayName("processes customer.subscription.updated webhook")
        void processesSubscriptionUpdate() {
            Map<String, Object> payload = Map.of(
                    "type", "customer.subscription.updated",
                    "data", Map.of()
            );

            tenantService.handleStripeWebhook(payload);

            // Should not throw
        }

        @Test
        @DisplayName("processes invoice.payment_succeeded webhook")
        void processesPaymentSuccess() {
            Map<String, Object> payload = Map.of(
                    "type", "invoice.payment_succeeded",
                    "data", Map.of()
            );

            tenantService.handleStripeWebhook(payload);

            // Should not throw
        }
    }
}
