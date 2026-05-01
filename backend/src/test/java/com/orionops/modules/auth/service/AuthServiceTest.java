package com.orionops.modules.auth.service;

import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.modules.auth.dto.UserResponse;
import com.orionops.modules.auth.dto.UserSyncRequest;
import com.orionops.modules.auth.entity.User;
import com.orionops.modules.auth.repository.UserRepository;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link AuthService}.
 * Covers user sync from Keycloak and current user resolution.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService")
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AuthService authService;

    private UUID tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.fromString("00000000-0000-0000-0000-000000000001");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void setupSecurityContext(String keycloakSubject) {
        Jwt jwt = Jwt.withTokenValue("test-token")
                .header("alg", "none")
                .claim("sub", keycloakSubject)
                .claim("tenant_id", tenantId.toString())
                .build();
        Authentication auth = new UsernamePasswordAuthenticationToken(jwt, jwt);
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
    }

    @Nested
    @DisplayName("syncUser")
    class SyncUserTests {

        @Test
        @DisplayName("should create new user when keycloakId not found")
        void shouldCreateNewUser_whenSyncing_givenNewKeycloakId() {
            String keycloakId = UUID.randomUUID().toString();

            UserSyncRequest request = UserSyncRequest.builder()
                    .keycloakId(keycloakId)
                    .username("jdoe")
                    .email("john.doe@orionops.com")
                    .firstName("John")
                    .lastName("Doe")
                    .department("Engineering")
                    .roles(Set.of("ENGINEER", "ADMIN"))
                    .groups(Set.of("platform-team"))
                    .build();

            when(userRepository.findByKeycloakId(keycloakId)).thenReturn(Optional.empty());
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User user = invocation.getArgument(0);
                user.setId(UUID.randomUUID());
                user.setCreatedAt(LocalDateTime.now());
                user.setUpdatedAt(LocalDateTime.now());
                return user;
            });

            UserResponse response = authService.syncUser(request);

            assertThat(response).isNotNull();
            assertThat(response.getUsername()).isEqualTo("jdoe");
            assertThat(response.getEmail()).isEqualTo("john.doe@orionops.com");
            assertThat(response.getFirstName()).isEqualTo("John");
            assertThat(response.getLastName()).isEqualTo("Doe");
            assertThat(response.isActive()).isTrue();
            assertThat(response.getRoles()).containsExactlyInAnyOrder("ENGINEER", "ADMIN");
            assertThat(response.getGroups()).containsExactly("platform-team");

            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            User savedUser = userCaptor.getValue();
            assertThat(savedUser.getKeycloakId()).isEqualTo(keycloakId);
            assertThat(savedUser.getUsername()).isEqualTo("jdoe");
        }

        @Test
        @DisplayName("should update existing user when keycloakId found")
        void shouldUpdateExistingUser_whenSyncing_givenExistingKeycloakId() {
            String keycloakId = UUID.randomUUID().toString();

            User existingUser = User.builder()
                    .keycloakId(keycloakId)
                    .username("jdoe")
                    .email("old.email@orionops.com")
                    .firstName("John")
                    .lastName("Doe")
                    .build();
            existingUser.setTenantId(tenantId);
            existingUser.setId(UUID.randomUUID());
            existingUser.setCreatedAt(LocalDateTime.now());
            existingUser.setUpdatedAt(LocalDateTime.now());

            UserSyncRequest request = UserSyncRequest.builder()
                    .keycloakId(keycloakId)
                    .username("jdoe")
                    .email("new.email@orionops.com")
                    .firstName("Johnny")
                    .lastName("Doe")
                    .build();

            when(userRepository.findByKeycloakId(keycloakId)).thenReturn(Optional.of(existingUser));
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User user = invocation.getArgument(0);
                user.setUpdatedAt(LocalDateTime.now());
                return user;
            });

            UserResponse response = authService.syncUser(request);

            assertThat(response).isNotNull();
            assertThat(response.getEmail()).isEqualTo("new.email@orionops.com");
            assertThat(response.getFirstName()).isEqualTo("Johnny");

            verify(userRepository).save(any(User.class));
        }
    }

    @Nested
    @DisplayName("getCurrentUser")
    class GetCurrentUserTests {

        @Test
        @DisplayName("should return current user from JWT context")
        void shouldReturnCurrentUser_whenJwtPresent_givenValidSecurityContext() {
            String keycloakSubject = "keycloak-user-123";

            User user = User.builder()
                    .keycloakId(keycloakSubject)
                    .username("jdoe")
                    .email("john.doe@orionops.com")
                    .firstName("John")
                    .lastName("Doe")
                    .build();
            user.setTenantId(tenantId);
            user.setId(UUID.randomUUID());
            user.setCreatedAt(LocalDateTime.now());

            setupSecurityContext(keycloakSubject);

            when(userRepository.findByKeycloakId(keycloakSubject)).thenReturn(Optional.of(user));

            User result = authService.getCurrentUser();

            assertThat(result).isNotNull();
            assertThat(result.getUsername()).isEqualTo("jdoe");
            assertThat(result.getKeycloakId()).isEqualTo(keycloakSubject);
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when no security context")
        void shouldThrowException_whenNoSecurityContext_givenNoAuth() {
            SecurityContextHolder.clearContext();

            assertThatThrownBy(() -> authService.getCurrentUser())
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when user not in local DB")
        void shouldThrowException_whenUserNotFound_givenMissingLocalUser() {
            String keycloakSubject = "keycloak-user-999";
            setupSecurityContext(keycloakSubject);

            when(userRepository.findByKeycloakId(keycloakSubject)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.getCurrentUser())
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");
        }
    }
}
