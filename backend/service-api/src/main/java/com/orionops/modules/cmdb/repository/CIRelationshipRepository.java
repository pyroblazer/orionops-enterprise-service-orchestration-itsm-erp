package com.orionops.modules.cmdb.repository;

import com.orionops.modules.cmdb.entity.CIRelationship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CIRelationshipRepository extends JpaRepository<CIRelationship, UUID> {

    @Query("SELECT r FROM CIRelationship r WHERE (r.sourceCiId = :ciId OR r.targetCiId = :ciId) AND r.deletedAt IS NULL")
    List<CIRelationship> findByCiId(@Param("ciId") UUID ciId);

    @Query("SELECT r FROM CIRelationship r WHERE r.sourceCiId = :ciId AND r.deletedAt IS NULL")
    List<CIRelationship> findOutgoingRelationships(@Param("ciId") UUID ciId);

    @Query("SELECT r FROM CIRelationship r WHERE r.targetCiId = :ciId AND r.deletedAt IS NULL")
    List<CIRelationship> findIncomingRelationships(@Param("ciId") UUID ciId);
}
