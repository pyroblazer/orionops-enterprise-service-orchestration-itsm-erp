package com.orionops.modules.auth.service;

import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.common.tenant.TenantContextHolder;
import com.orionops.modules.auth.dto.LoginRequest;
import com.orionops.modules.auth.dto.LoginResponse;
import com.orionops.modules.auth.dto.RegisterRequest;
import com.orionops.modules.auth.dto.UserResponse;
import com.orionops.modules.auth.dto.UserSyncRequest;
import com.orionops.modules.auth.entity.User;
import com.orionops.modules.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
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
    private final KeycloakService keycloakService;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

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
        return TenantContextHolder.getCurrentTenantId();
    }

    /**
     * Authenticates a user with username and password, returning a JWT.
     * This bypasses Keycloak and validates against the local BCrypt hash.
     *
     * @param request login credentials (username + password)
     * @return LoginResponse with JWT, or empty if authentication fails
     */
    @Transactional(readOnly = true)
    public Optional<LoginResponse> loginWithPassword(LoginRequest request) {
        // Look up by username, fall back to email
        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmail(request.getUsername());
        }

        if (userOpt.isEmpty()) {
            log.warn("Login failed: user not found for username={}", request.getUsername());
            return Optional.empty();
        }

        User user = userOpt.get();

        if (!user.isActive() || user.getPasswordHash() == null) {
            log.warn("Login failed: user inactive or no password set for username={}", request.getUsername());
            return Optional.empty();
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            log.warn("Login failed: invalid password for username={}", request.getUsername());
            return Optional.empty();
        }

        try {
            String accessToken = jwtTokenProvider.generateToken(user);
            String refreshToken = jwtTokenProvider.generateRefreshToken(user);
            LoginResponse response = LoginResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .tokenType("Bearer")
                    .expiresIn(jwtTokenProvider.getExpirationSeconds())
                    .build();
            log.info("User logged in successfully: username={}", user.getUsername());
            return Optional.of(response);
        } catch (Exception e) {
            log.error("Failed to generate JWT for user: {}", user.getUsername(), e);
            return Optional.empty();
        }
    }

    /**
     * Registers a new user in Keycloak and creates a local user record.
     * The user must be synced separately after registration via the sync-user endpoint.
     *
     * @param request the registration request containing user data
     * @throws IllegalArgumentException if username/email already exists
     * @throws Exception if registration fails
     */
    @Transactional
    public void register(RegisterRequest request) throws Exception {
        log.info("Registering new user: username={}, email={}", request.getUsername(), request.getEmail());

        // Register in Keycloak
        try {
            keycloakService.registerUser(
                    request.getUsername(),
                    request.getEmail(),
                    request.getPassword(),
                    request.getFirstName(),
                    request.getLastName()
            );
        } catch (IllegalArgumentException e) {
            log.warn("Registration failed - user already exists: {}", request.getUsername());
            throw e;
        } catch (Exception e) {
            log.error("Failed to register user in Keycloak", e);
            throw e;
        }
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
