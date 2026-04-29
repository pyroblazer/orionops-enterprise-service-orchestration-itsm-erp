package com.orionops.modules.auth.repository;

import com.orionops.modules.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for User entity operations.
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByKeycloakId(String keycloakId);

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.username = :username AND u.deletedAt IS NULL")
    Optional<User> findByTenantIdAndUsername(UUID tenantId, String username);

    boolean existsByKeycloakId(String keycloakId);

    boolean existsByEmail(String email);
}
