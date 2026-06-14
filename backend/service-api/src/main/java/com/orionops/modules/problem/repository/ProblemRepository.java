package com.orionops.modules.problem.repository;

import com.orionops.modules.problem.entity.Problem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Repository for Problem entity operations.
 */
@Repository
public interface ProblemRepository extends JpaRepository<Problem, UUID> {

    Page<Problem> findByTenantIdAndDeletedAtIsNull(UUID tenantId, Pageable pageable);

    Page<Problem> findByTenantIdAndStatusAndDeletedAtIsNull(UUID tenantId, Problem.ProblemStatus status, Pageable pageable);

    @Query("SELECT p FROM Problem p WHERE p.tenantId = :tenantId " +
            "AND p.deletedAt IS NULL " +
            "AND (:status IS NULL OR p.status = :status) " +
            "AND (:priority IS NULL OR p.priority = :priority) " +
            "AND (LOWER(p.title) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Problem> searchProblems(
            @Param("tenantId") UUID tenantId,
            @Param("status") Problem.ProblemStatus status,
            @Param("priority") Problem.ProblemPriority priority,
            @Param("search") String search,
            Pageable pageable);
}
