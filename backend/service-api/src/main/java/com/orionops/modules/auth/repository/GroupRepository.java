package com.orionops.modules.auth.repository;

import com.orionops.modules.auth.entity.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Group entity operations.
 */
@Repository
public interface GroupRepository extends JpaRepository<Group, UUID> {

    Optional<Group> findByName(String name);

    Optional<Group> findByKeycloakGroupId(String keycloakGroupId);

    boolean existsByName(String name);
}
