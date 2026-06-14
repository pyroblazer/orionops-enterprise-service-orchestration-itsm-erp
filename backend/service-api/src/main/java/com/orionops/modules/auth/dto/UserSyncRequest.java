package com.orionops.modules.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

/**
 * Request DTO for syncing a Keycloak user to the local database.
 * Contains user data extracted from the JWT token or Keycloak admin API.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSyncRequest {

    @NotBlank(message = "Keycloak ID is required")
    private String keycloakId;

    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Valid email is required")
    private String email;

    private String firstName;
    private String lastName;
    private String department;
    private String phone;
    private String avatarUrl;

    private Set<String> roles;
    private Set<String> groups;
}
