package com.orionops.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

/**
 * Response DTO for user data returned to API consumers.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private UUID id;
    private String keycloakId;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String department;
    private String phone;
    private String avatarUrl;
    private boolean active;
    private Set<String> roles;
    private Set<String> groups;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
