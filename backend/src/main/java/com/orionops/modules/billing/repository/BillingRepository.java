package com.orionops.modules.billing.repository;

import com.orionops.modules.billing.entity.BillingRecord;
import com.orionops.modules.billing.entity.CostModel;
import com.orionops.modules.billing.entity.ServiceUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class BillingRepository {

    @Repository
    public interface ServiceUsageRepository extends JpaRepository<ServiceUsage, UUID> {
        List<ServiceUsage> findByTenantIdAndDeletedAtIsNull(UUID tenantId);
        @Query("SELECT su FROM ServiceUsage su WHERE su.tenantId = :tenantId AND su.deletedAt IS NULL AND su.usageDate BETWEEN :start AND :end")
        List<ServiceUsage> findByPeriod(UUID tenantId, LocalDateTime start, LocalDateTime end);
    }

    @Repository
    public interface BillingRecordRepository extends JpaRepository<BillingRecord, UUID> {
        List<BillingRecord> findByTenantIdAndDeletedAtIsNull(UUID tenantId);
    }

    @Repository
    public interface CostModelRepository extends JpaRepository<CostModel, UUID> {
        List<CostModel> findByTenantIdAndDeletedAtIsNull(UUID tenantId);
    }
}
