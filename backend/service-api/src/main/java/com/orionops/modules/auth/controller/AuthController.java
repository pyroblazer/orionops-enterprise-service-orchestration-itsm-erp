package com.orionops.modules.auth.controller;

import com.orionops.common.dto.ApiResponse;
import com.orionops.modules.auth.dto.LoginRequest;
import com.orionops.modules.auth.dto.LoginResponse;
import com.orionops.modules.auth.dto.RegisterRequest;
import com.orionops.modules.auth.dto.UserResponse;
import com.orionops.modules.auth.dto.UserSyncRequest;
import com.orionops.modules.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for authentication and user profile operations.
 * Handles user sync from Keycloak and current user profile retrieval.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "User authentication and profile management")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Login with username and password", description = "Authenticates a user with local credentials and returns a JWT token")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        return authService.loginWithPassword(request)
                .map(response -> ResponseEntity.ok(ApiResponse.success(response)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Invalid username or password")));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user profile", description = "Returns the profile of the currently authenticated user")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser() {
        UserResponse user = authService.getCurrentUserResponse();
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PostMapping("/sync-user")
    @Operation(summary = "Sync Keycloak user", description = "Synchronizes a Keycloak user to the local database")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserResponse>> syncUser(
            @Valid @RequestBody UserSyncRequest request) {
        UserResponse user = authService.syncUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(user, "User synced successfully"));
    }

    @PostMapping("/register")
    @Operation(summary = "Register new user", description = "Registers a new user account via username and password")
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
        try {
            authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(null, "User registered successfully. Please sign in."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Registration failed: " + e.getMessage()));
        }
    }
}
