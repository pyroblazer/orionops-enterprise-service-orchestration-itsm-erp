package com.orionops.modules.vendor.repository;

import com.orionops.modules.vendor.entity.Vendor;
import com.orionops.modules.vendor.entity.VendorPerformance;
import com.orionops.modules.vendor.entity.VendorSLA;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

public class VendorRepository {

    @Repository
    public interface VendorEntityRepository extends JpaRepository<Vendor, UUID> {
        List<Vendor> findByTenantIdAndDeletedAtIsNull(UUID tenantId);
    }

    @Repository
    public interface VendorSLARepository extends JpaRepository<VendorSLA, UUID> {
        List<VendorSLA> findByVendorIdAndDeletedAtIsNull(UUID vendorId);
    }

    @Repository
    public interface VendorPerformanceRepository extends JpaRepository<VendorPerformance, UUID> {
        List<VendorPerformance> findByVendorIdAndDeletedAtIsNull(UUID vendorId);
    }
}
