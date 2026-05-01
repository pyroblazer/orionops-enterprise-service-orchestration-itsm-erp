package com.orionops.modules.integration.service;

import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.modules.integration.dto.IntegrationRequest;
import com.orionops.modules.integration.dto.IntegrationResponse;
import com.orionops.modules.integration.entity.IntegrationEndpoint;
import com.orionops.modules.integration.repository.IntegrationEndpointRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class IntegrationService {

    private final IntegrationEndpointRepository endpointRepository;
    private final WebClient.Builder webClientBuilder;

    @Transactional
    public IntegrationResponse createEndpoint(IntegrationRequest req) {
        IntegrationEndpoint endpoint = IntegrationEndpoint.builder()
                .name(req.getName()).description(req.getDescription()).type(req.getType())
                .url(req.getUrl()).method(req.getMethod() != null ? req.getMethod() : "POST")
                .headers(req.getHeaders()).authConfig(req.getAuthConfig())
                .payloadTemplate(req.getPayloadTemplate()).verifySsl(req.isVerifySsl())
                .timeoutSeconds(req.getTimeoutSeconds() != null ? req.getTimeoutSeconds() : 30)
                .build();
        endpoint.setTenantId(resolveTenantId());
        return mapToResponse(endpointRepository.save(endpoint));
    }

    @Transactional(readOnly = true)
    public List<IntegrationResponse> listEndpoints() {
        return endpointRepository.findByTenantIdAndDeletedAtIsNull(resolveTenantId())
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public IntegrationResponse getEndpoint(UUID id) {
        return mapToResponse(findEndpointOrThrow(id));
    }

    @Transactional
    public IntegrationResponse updateEndpoint(UUID id, IntegrationRequest req) {
        IntegrationEndpoint endpoint = findEndpointOrThrow(id);
        if (req.getName() != null) endpoint.setName(req.getName());
        if (req.getDescription() != null) endpoint.setDescription(req.getDescription());
        if (req.getType() != null) endpoint.setType(req.getType());
        if (req.getUrl() != null) endpoint.setUrl(req.getUrl());
        if (req.getMethod() != null) endpoint.setMethod(req.getMethod());
        if (req.getHeaders() != null) endpoint.setHeaders(req.getHeaders());
        if (req.getAuthConfig() != null) endpoint.setAuthConfig(req.getAuthConfig());
        if (req.getPayloadTemplate() != null) endpoint.setPayloadTemplate(req.getPayloadTemplate());
        return mapToResponse(endpointRepository.save(endpoint));
    }

    @Transactional
    public Map<String, Object> testEndpoint(UUID id) {
        IntegrationEndpoint endpoint = findEndpointOrThrow(id);
        log.info("Testing integration endpoint: name={}, url={}", endpoint.getName(), endpoint.getUrl());
        try {
            WebClient webClient = webClientBuilder.build();
            String response = webClient.get()
                    .uri(endpoint.getUrl())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(endpoint.getTimeoutSeconds()))
                    .block();
            return Map.of("success", true, "response", response != null ? response : "OK", "endpointId", id);
        } catch (Exception e) {
            log.error("Endpoint test failed: {}", e.getMessage());
            return Map.of("success", false, "error", e.getMessage(), "endpointId", id);
        }
    }

    @Transactional
    public void deleteEndpoint(UUID id) {
        IntegrationEndpoint endpoint = findEndpointOrThrow(id);
        endpoint.softDelete();
        endpointRepository.save(endpoint);
    }

    private IntegrationEndpoint findEndpointOrThrow(UUID id) {
        return endpointRepository.findById(id)
                .filter(e -> !e.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("IntegrationEndpoint", id));
    }

    private UUID resolveTenantId() {
        return UUID.fromString("00000000-0000-0000-0000-000000000001");
    }

    private IntegrationResponse mapToResponse(IntegrationEndpoint e) {
        return IntegrationResponse.builder()
                .id(e.getId()).name(e.getName()).description(e.getDescription())
                .type(e.getType()).url(e.getUrl()).method(e.getMethod())
                .status(e.getStatus()).verifySsl(e.isVerifySsl())
                .timeoutSeconds(e.getTimeoutSeconds())
                .createdAt(e.getCreatedAt()).updatedAt(e.getUpdatedAt()).build();
    }
}
