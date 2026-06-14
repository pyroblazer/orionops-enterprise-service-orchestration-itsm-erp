package com.orionops.common.auditing;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Base entity for all domain entities in the platform.
 * Provides common fields: id, audit fields (created/updated by/date),
 * soft delete support (deletedAt), and multi-tenant isolation (tenantId).
 *
 * <p>All concrete entities should extend this class to inherit consistent
 * auditing and tenant isolation behavior.</p>
 */
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public abstract class BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @CreatedDate
    @Column(updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @CreatedBy
    @Column(updatable = false, nullable = false, length = 255)
    private String createdBy;

    @LastModifiedBy
    @Column(nullable = false, length = 255)
    private String updatedBy;

    @Column
    private LocalDateTime deletedAt;

    @Column(nullable = false)
    private UUID tenantId;

    /**
     * Marks this entity as soft-deleted by setting deletedAt to now.
     */
    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }

    /**
     * Returns true if this entity has been soft-deleted.
     */
    public boolean isDeleted() {
        return this.deletedAt != null;
    }
}
