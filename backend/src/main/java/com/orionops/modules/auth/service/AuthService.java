package com.orionops.modules.auth.service;

import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.modules.auth.dto.UserResponse;
import com.orionops.modules.auth.dto.UserSyncRequest;
import com.orionops.modules.auth.entity.User;
import com.orionops.modules.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Service for authentication-related operations including user synchronization
 * from Keycloak to the local database, and resolving current user context.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;

    /**
     * Gets the current authenticated user from the security context.
     * Expects a JWT-based authentication.
     *
     * @return the current user entity
     * @throws ResourceNotFoundException if the user is not found in the local DB
     */
    @Transactional(readOnly = true)
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            throw new ResourceNotFoundException("User", "current");
        }

        String keycloakId = jwt.getSubject();
        return userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new ResourceNotFoundException("User", keycloakId));
    }

    /**
     * Gets the current user as a response DTO.
     */
    @Transactional(readOnly = true)
    public UserResponse getCurrentUserResponse() {
        return mapToResponse(getCurrentUser());
    }

    /**
     * Synchronizes a Keycloak user to the local database.
     * If the user already exists (by keycloakId), updates their information.
     * If not, creates a new local user record.
     *
     * @param request the user sync request containing Keycloak data
     * @return the synced user response
     */
    @Transactional
    public UserResponse syncUser(UserSyncRequest request) {
        log.info("Syncing user from Keycloak: keycloakId={}, username={}", request.getKeycloakId(), request.getUsername());

        User user = userRepository.findByKeycloakId(request.getKeycloakId())
                .orElseGet(() -> {
                    log.info("Creating new local user for Keycloak user: {}", request.getUsername());
                    User newUser = new User();
                    newUser.setKeycloakId(request.getKeycloakId());
                    return newUser;
                });

        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setDepartment(request.getDepartment());
        user.setPhone(request.getPhone());
        user.setAvatarUrl(request.getAvatarUrl());
        user.setActive(true);

        if (request.getRoles() != null) {
            user.setRoles(request.getRoles());
        }
        if (request.getGroups() != null) {
            user.setGroups(request.getGroups());
        }

        // If tenant ID is not set, derive from JWT context or use a default
        if (user.getTenantId() == null) {
            user.setTenantId(resolveTenantId());
        }

        User saved = userRepository.save(user);
        log.info("User synced successfully: id={}, username={}", saved.getId(), saved.getUsername());
        return mapToResponse(saved);
    }

    /**
     * Resolves the current tenant ID from the JWT token or security context.
     * Falls back to extracting from JWT claims.
     */
    private UUID resolveTenantId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            String tenantIdStr = jwt.getClaimAsString("tenant_id");
            if (tenantIdStr != null) {
                return UUID.fromString(tenantIdStr);
            }
        }
        // Default tenant for standalone deployments
        return UUID.fromString("00000000-0000-0000-0000-000000000001");
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .keycloakId(user.getKeycloakId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .department(user.getDepartment())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .active(user.isActive())
                .roles(user.getRoles())
                .groups(user.getGroups())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
