package com.orionops.modules.procurement.service;

import com.orionops.common.exception.BusinessRuleException;
import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.modules.procurement.dto.ProcurementRequest;
import com.orionops.modules.procurement.dto.ProcurementResponse;
import com.orionops.modules.procurement.entity.*;
import com.orionops.modules.procurement.repository.ProcurementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProcurementService {

    private final ProcurementRepository.PurchaseRequestRepository prRepository;
    private final ProcurementRepository.PurchaseOrderRepository poRepository;
    private final ProcurementRepository.VendorRepository vendorRepository;
    private final ProcurementRepository.ContractRepository contractRepository;

    // Purchase Requests
    @Transactional
    public ProcurementResponse.PRResponse createPR(ProcurementRequest.PRRequest req) {
        PurchaseRequest pr = PurchaseRequest.builder()
                .title(req.getTitle()).description(req.getDescription())
                .estimatedCost(req.getEstimatedCost()).requestedBy(req.getRequestedBy())
                .vendorId(req.getVendorId()).status(PurchaseRequest.PRStatus.DRAFT)
                .tenantId(resolveTenantId()).build();
        return mapPR(prRepository.save(pr));
    }

    @Transactional(readOnly = true)
    public List<ProcurementResponse.PRResponse> listPRs() {
        return prRepository.findByTenantIdAndDeletedAtIsNull(resolveTenantId()).stream().map(this::mapPR).collect(Collectors.toList());
    }

    @Transactional
    public ProcurementResponse.PRResponse submitPR(UUID id) {
        PurchaseRequest pr = findPROrThrow(id);
        if (pr.getStatus() != PurchaseRequest.PRStatus.DRAFT) throw new BusinessRuleException("Only draft PRs can be submitted");
        pr.setStatus(PurchaseRequest.PRStatus.SUBMITTED);
        pr.setSubmittedAt(LocalDateTime.now());
        return mapPR(prRepository.save(pr));
    }

    @Transactional
    public ProcurementResponse.POResponse createPOFromPR(UUID prId, ProcurementRequest.PORequest poReq) {
        PurchaseRequest pr = findPROrThrow(prId);
        if (pr.getStatus() != PurchaseRequest.PRStatus.APPROVED) throw new BusinessRuleException("PR must be approved first");
        PurchaseOrder po = PurchaseOrder.builder()
                .poNumber(poReq.getPoNumber()).purchaseRequestId(prId)
                .vendorId(poReq.getVendorId() != null ? poReq.getVendorId() : pr.getVendorId())
                .totalAmount(poReq.getTotalAmount()).deliveryDate(poReq.getDeliveryDate())
                .terms(poReq.getTerms()).orderDate(LocalDateTime.now())
                .status(PurchaseOrder.POStatus.ISSUED)
                .tenantId(resolveTenantId()).build();
        pr.setStatus(PurchaseRequest.PRStatus.ORDERED);
        prRepository.save(pr);
        return mapPO(poRepository.save(po));
    }

    // Purchase Orders
    @Transactional(readOnly = true)
    public List<ProcurementResponse.POResponse> listPOs() {
        return poRepository.findByTenantIdAndDeletedAtIsNull(resolveTenantId()).stream().map(this::mapPO).collect(Collectors.toList());
    }

    // Vendors
    @Transactional
    public ProcurementResponse.VendorResponse createVendor(ProcurementRequest.VendorRequest req) {
        Vendor v = Vendor.builder()
                .name(req.getName()).description(req.getDescription())
                .contactEmail(req.getContactEmail()).contactPhone(req.getContactPhone())
                .address(req.getAddress()).website(req.getWebsite())
                .tenantId(resolveTenantId()).build();
        return mapVendor(vendorRepository.save(v));
    }

    @Transactional(readOnly = true)
    public List<ProcurementResponse.VendorResponse> listVendors() {
        return vendorRepository.findByTenantIdAndDeletedAtIsNull(resolveTenantId()).stream().map(this::mapVendor).collect(Collectors.toList());
    }

    // Contracts
    @Transactional
    public ProcurementResponse.ContractResponse createContract(ProcurementRequest.ContractRequest req) {
        Contract c = Contract.builder()
                .title(req.getTitle()).description(req.getDescription())
                .vendorId(req.getVendorId()).value(req.getValue())
                .startDate(req.getStartDate()).endDate(req.getEndDate())
                .terms(req.getTerms()).tenantId(resolveTenantId()).build();
        return mapContract(contractRepository.save(c));
    }

    @Transactional(readOnly = true)
    public List<ProcurementResponse.ContractResponse> listContracts() {
        return contractRepository.findByTenantIdAndDeletedAtIsNull(resolveTenantId()).stream().map(this::mapContract).collect(Collectors.toList());
    }

    private PurchaseRequest findPROrThrow(UUID id) {
        return prRepository.findById(id).filter(p -> !p.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("PurchaseRequest", id));
    }

    private UUID resolveTenantId() { return UUID.fromString("00000000-0000-0000-0000-000000000001"); }

    private ProcurementResponse.PRResponse mapPR(PurchaseRequest p) {
        return ProcurementResponse.PRResponse.builder().id(p.getId()).title(p.getTitle())
                .description(p.getDescription()).estimatedCost(p.getEstimatedCost())
                .requestedBy(p.getRequestedBy()).approvedBy(p.getApprovedBy())
                .vendorId(p.getVendorId()).status(p.getStatus().name())
                .submittedAt(p.getSubmittedAt()).approvedAt(p.getApprovedAt())
                .createdAt(p.getCreatedAt()).build();
    }

    private ProcurementResponse.POResponse mapPO(PurchaseOrder p) {
        return ProcurementResponse.POResponse.builder().id(p.getId()).poNumber(p.getPoNumber())
                .purchaseRequestId(p.getPurchaseRequestId()).vendorId(p.getVendorId())
                .totalAmount(p.getTotalAmount()).status(p.getStatus().name())
                .orderDate(p.getOrderDate()).deliveryDate(p.getDeliveryDate())
                .createdAt(p.getCreatedAt()).build();
    }

    private ProcurementResponse.VendorResponse mapVendor(Vendor v) {
        return ProcurementResponse.VendorResponse.builder().id(v.getId()).name(v.getName())
                .description(v.getDescription()).contactEmail(v.getContactEmail())
                .contactPhone(v.getContactPhone()).address(v.getAddress())
                .website(v.getWebsite()).active(v.isActive()).createdAt(v.getCreatedAt()).build();
    }

    private ProcurementResponse.ContractResponse mapContract(Contract c) {
        return ProcurementResponse.ContractResponse.builder().id(c.getId()).title(c.getTitle())
                .description(c.getDescription()).vendorId(c.getVendorId()).value(c.getValue())
                .startDate(c.getStartDate()).endDate(c.getEndDate()).status(c.getStatus().name())
                .createdAt(c.getCreatedAt()).build();
    }
}
