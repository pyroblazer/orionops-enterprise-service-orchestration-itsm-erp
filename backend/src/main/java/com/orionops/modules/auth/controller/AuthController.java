package com.orionops.modules.auth.controller;

import com.orionops.common.dto.ApiResponse;
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
}
