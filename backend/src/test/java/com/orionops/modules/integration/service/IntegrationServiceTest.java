package com.orionops.modules.integration.service;

import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.common.tenant.TenantContextHolder;
import com.orionops.modules.integration.dto.IntegrationRequest;
import com.orionops.modules.integration.dto.IntegrationResponse;
import com.orionops.modules.integration.entity.IntegrationEndpoint;
import com.orionops.modules.integration.repository.IntegrationEndpointRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link IntegrationService}.
 * Covers CRUD operations, defaults, partial update, soft delete, and test endpoint.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("IntegrationService")
class IntegrationServiceTest {

    @Mock
    private IntegrationEndpointRepository endpointRepository;

    @Mock
    private WebClient.Builder webClientBuilder;

    @InjectMocks
    private IntegrationService integrationService;

    private UUID tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        TenantContextHolder.setCurrentTenantId(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private IntegrationRequest buildRequest(String name, String url) {
        IntegrationRequest req = new IntegrationRequest();
        req.setName(name);
        req.setUrl(url);
        req.setType(IntegrationEndpoint.IntegrationType.WEBHOOK);
        return req;
    }

    private IntegrationEndpoint buildEndpoint(UUID id, String name) {
        IntegrationEndpoint endpoint = IntegrationEndpoint.builder()
                .name(name)
                .url("https://example.com/webhook")
                .type(IntegrationEndpoint.IntegrationType.WEBHOOK)
                .method("POST")
                .status(IntegrationEndpoint.IntegrationStatus.ACTIVE)
                .verifySsl(true)
                .timeoutSeconds(30)
                .build();
        endpoint.setId(id);
        endpoint.setTenantId(tenantId);
        return endpoint;
    }

    // ========================================================================
    // CREATE ENDPOINT
    // ========================================================================

    @Nested
    @DisplayName("createEndpoint")
    class CreateEndpoint {

        @Test
        @DisplayName("sets defaults: method=POST, timeoutSeconds=30")
        void setsDefaults() {
            IntegrationRequest req = buildRequest("Test Hook", "https://example.com/hook");
            req.setMethod(null);
            req.setTimeoutSeconds(null);

            when(endpointRepository.save(any(IntegrationEndpoint.class)))
                    .thenAnswer(invocation -> {
                        IntegrationEndpoint e = invocation.getArgument(0);
                        e.setId(UUID.randomUUID());
                        return e;
                    });

            IntegrationResponse response = integrationService.createEndpoint(req);

            ArgumentCaptor<IntegrationEndpoint> captor = ArgumentCaptor.forClass(IntegrationEndpoint.class);
            verify(endpointRepository).save(captor.capture());
            IntegrationEndpoint saved = captor.getValue();

            assertThat(saved.getMethod()).isEqualTo("POST");
            assertThat(saved.getTimeoutSeconds()).isEqualTo(30);
        }

        @Test
        @DisplayName("sets tenantId from context")
        void setsTenantId() {
            IntegrationRequest req = buildRequest("Hook", "https://example.com/hook");

            when(endpointRepository.save(any(IntegrationEndpoint.class)))
                    .thenAnswer(invocation -> {
                        IntegrationEndpoint e = invocation.getArgument(0);
                        e.setId(UUID.randomUUID());
                        return e;
                    });

            integrationService.createEndpoint(req);

            ArgumentCaptor<IntegrationEndpoint> captor = ArgumentCaptor.forClass(IntegrationEndpoint.class);
            verify(endpointRepository).save(captor.capture());
            assertThat(captor.getValue().getTenantId()).isEqualTo(tenantId);
        }
    }

    // ========================================================================
    // GET ENDPOINT
    // ========================================================================

    @Nested
    @DisplayName("getEndpoint")
    class GetEndpoint {

        @Test
        @DisplayName("returns mapped response for existing endpoint")
        void returnsResponse() {
            UUID id = UUID.randomUUID();
            IntegrationEndpoint endpoint = buildEndpoint(id, "My Hook");
            when(endpointRepository.findById(id)).thenReturn(Optional.of(endpoint));

            IntegrationResponse response = integrationService.getEndpoint(id);

            assertThat(response.getName()).isEqualTo("My Hook");
        }

        @Test
        @DisplayName("throws ResourceNotFoundException for missing endpoint")
        void throwsForMissing() {
            UUID id = UUID.randomUUID();
            when(endpointRepository.findById(id)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> integrationService.getEndpoint(id))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("throws ResourceNotFoundException for soft-deleted endpoint")
        void throwsForSoftDeleted() {
            UUID id = UUID.randomUUID();
            IntegrationEndpoint endpoint = buildEndpoint(id, "Deleted Hook");
            endpoint.softDelete();
            when(endpointRepository.findById(id)).thenReturn(Optional.of(endpoint));

            assertThatThrownBy(() -> integrationService.getEndpoint(id))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ========================================================================
    // UPDATE ENDPOINT
    // ========================================================================

    @Nested
    @DisplayName("updateEndpoint")
    class UpdateEndpoint {

        @Test
        @DisplayName("partial update: only non-null fields changed")
        void partialUpdate() {
            UUID id = UUID.randomUUID();
            IntegrationEndpoint existing = buildEndpoint(id, "Old Name");
            when(endpointRepository.findById(id)).thenReturn(Optional.of(existing));
            when(endpointRepository.save(any(IntegrationEndpoint.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            IntegrationRequest req = new IntegrationRequest();
            req.setName("New Name");
            // url, description, type, etc. are all null → unchanged

            IntegrationResponse response = integrationService.updateEndpoint(id, req);

            assertThat(response.getName()).isEqualTo("New Name");
        }
    }

    // ========================================================================
    // DELETE ENDPOINT
    // ========================================================================

    @Nested
    @DisplayName("deleteEndpoint")
    class DeleteEndpoint {

        @Test
        @DisplayName("soft deletes by setting deletedAt")
        void softDeletes() {
            UUID id = UUID.randomUUID();
            IntegrationEndpoint endpoint = buildEndpoint(id, "To Delete");
            when(endpointRepository.findById(id)).thenReturn(Optional.of(endpoint));
            when(endpointRepository.save(any(IntegrationEndpoint.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            integrationService.deleteEndpoint(id);

            ArgumentCaptor<IntegrationEndpoint> captor = ArgumentCaptor.forClass(IntegrationEndpoint.class);
            verify(endpointRepository).save(captor.capture());
            assertThat(captor.getValue().isDeleted()).isTrue();
        }
    }

    // ========================================================================
    // TEST ENDPOINT
    // ========================================================================

    @Nested
    @DisplayName("testEndpoint")
    class TestEndpoint {

        @Test
        @DisplayName("returns success map for reachable URL")
        void returnsSuccessMap() {
            UUID id = UUID.randomUUID();
            IntegrationEndpoint endpoint = buildEndpoint(id, "Test Hook");
            endpoint.setUrl("https://example.com/health");
            when(endpointRepository.findById(id)).thenReturn(Optional.of(endpoint));

            WebClient mockClient = org.mockito.Mockito.mock(WebClient.class);
            WebClient.RequestHeadersUriSpec uriSpec = org.mockito.Mockito.mock(WebClient.RequestHeadersUriSpec.class);
            WebClient.ResponseSpec responseSpec = org.mockito.Mockito.mock(WebClient.ResponseSpec.class);
            when(webClientBuilder.build()).thenReturn(mockClient);
            when(mockClient.get()).thenReturn(uriSpec);
            when(uriSpec.uri(anyString())).thenReturn(uriSpec);
            when(uriSpec.retrieve()).thenReturn(responseSpec);
            when(responseSpec.bodyToMono(String.class))
                    .thenReturn(reactor.core.publisher.Mono.just("OK"));

            java.util.Map<String, Object> result = integrationService.testEndpoint(id);

            assertThat(result.get("success")).isEqualTo(true);
            assertThat(result.get("endpointId")).isEqualTo(id);
        }

        @Test
        @DisplayName("returns error map for unreachable URL")
        void returnsErrorMap() {
            UUID id = UUID.randomUUID();
            IntegrationEndpoint endpoint = buildEndpoint(id, "Test Hook");
            endpoint.setUrl("https://unreachable.invalid/health");
            when(endpointRepository.findById(id)).thenReturn(Optional.of(endpoint));

            WebClient mockClient = org.mockito.Mockito.mock(WebClient.class);
            WebClient.RequestHeadersUriSpec uriSpec = org.mockito.Mockito.mock(WebClient.RequestHeadersUriSpec.class);
            WebClient.ResponseSpec responseSpec = org.mockito.Mockito.mock(WebClient.ResponseSpec.class);
            when(webClientBuilder.build()).thenReturn(mockClient);
            when(mockClient.get()).thenReturn(uriSpec);
            when(uriSpec.uri(anyString())).thenReturn(uriSpec);
            when(uriSpec.retrieve()).thenReturn(responseSpec);
            when(responseSpec.bodyToMono(String.class))
                    .thenReturn(reactor.core.publisher.Mono.error(new RuntimeException("Connection refused")));

            java.util.Map<String, Object> result = integrationService.testEndpoint(id);

            assertThat(result.get("success")).isEqualTo(false);
            assertThat(result.get("error").toString()).contains("Connection refused");
        }
    }

    // ========================================================================
    // LIST ENDPOINTS
    // ========================================================================

    @Nested
    @DisplayName("listEndpoints")
    class ListEndpoints {

        @Test
        @DisplayName("returns empty list when no endpoints")
        void returnsEmptyList() {
            when(endpointRepository.findByTenantIdAndDeletedAtIsNull(tenantId))
                    .thenReturn(List.of());

            List<IntegrationResponse> result = integrationService.listEndpoints();

            assertThat(result).isEmpty();
        }
    }
}
