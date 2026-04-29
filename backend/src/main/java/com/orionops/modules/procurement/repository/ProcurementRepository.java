package com.orionops.modules.procurement.repository;

import com.orionops.modules.procurement.entity.Contract;
import com.orionops.modules.procurement.entity.PurchaseOrder;
import com.orionops.modules.procurement.entity.PurchaseRequest;
import com.orionops.modules.procurement.entity.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

public class ProcurementRepository {

    @Repository
    public interface PurchaseRequestRepository extends JpaRepository<PurchaseRequest, UUID> {
        List<PurchaseRequest> findByTenantIdAndDeletedAtIsNull(UUID tenantId);
    }

    @Repository
    public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, UUID> {
        List<PurchaseOrder> findByTenantIdAndDeletedAtIsNull(UUID tenantId);
    }

    @Repository
    public interface VendorRepository extends JpaRepository<Vendor, UUID> {
        List<Vendor> findByTenantIdAndDeletedAtIsNull(UUID tenantId);
    }

    @Repository
    public interface ContractRepository extends JpaRepository<Contract, UUID> {
        List<Contract> findByTenantIdAndDeletedAtIsNull(UUID tenantId);
        List<Contract> findByVendorIdAndDeletedAtIsNull(UUID vendorId);
    }
}
