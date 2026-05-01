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
                .build();
        pr.setTenantId(resolveTenantId());
        return mapPR(prRepository.save(pr));
    }

    @Transactional(readOnly = true)
    public List<ProcurementResponse.PRResponse> listPRs() {
        return prRepository.findByTenantIdAndDeletedAtIsNull(resolveTenantId()).stream().map(this::mapPR).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProcurementResponse.PRResponse getPR(UUID id) {
        return mapPR(findPROrThrow(id));
    }

    @Transactional
    public ProcurementResponse.PRResponse updatePR(UUID id, ProcurementRequest.PRRequest req) {
        PurchaseRequest pr = findPROrThrow(id);
        pr.setTitle(req.getTitle());
        pr.setDescription(req.getDescription());
        pr.setEstimatedCost(req.getEstimatedCost());
        pr.setRequestedBy(req.getRequestedBy());
        pr.setVendorId(req.getVendorId());
        return mapPR(prRepository.save(pr));
    }

    @Transactional
    public void deletePR(UUID id) {
        PurchaseRequest pr = findPROrThrow(id);
        pr.softDelete();
        prRepository.save(pr);
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
                .build();
        po.setTenantId(resolveTenantId());
        pr.setStatus(PurchaseRequest.PRStatus.ORDERED);
        prRepository.save(pr);
        return mapPO(poRepository.save(po));
    }

    // Purchase Orders
    @Transactional(readOnly = true)
    public List<ProcurementResponse.POResponse> listPOs() {
        return poRepository.findByTenantIdAndDeletedAtIsNull(resolveTenantId()).stream().map(this::mapPO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProcurementResponse.POResponse getPO(UUID id) {
        return mapPO(findPOOrThrow(id));
    }

    @Transactional
    public ProcurementResponse.POResponse updatePO(UUID id, ProcurementRequest.PORequest req) {
        PurchaseOrder po = findPOOrThrow(id);
        po.setPoNumber(req.getPoNumber());
        po.setVendorId(req.getVendorId());
        po.setTotalAmount(req.getTotalAmount());
        po.setDeliveryDate(req.getDeliveryDate());
        po.setTerms(req.getTerms());
        return mapPO(poRepository.save(po));
    }

    @Transactional
    public void deletePO(UUID id) {
        PurchaseOrder po = findPOOrThrow(id);
        po.softDelete();
        poRepository.save(po);
    }

    // Vendors
    @Transactional
    public ProcurementResponse.VendorResponse createVendor(ProcurementRequest.VendorRequest req) {
        Vendor v = Vendor.builder()
                .name(req.getName()).description(req.getDescription())
                .contactEmail(req.getContactEmail()).contactPhone(req.getContactPhone())
                .address(req.getAddress()).website(req.getWebsite())
                .build();
        v.setTenantId(resolveTenantId());
        return mapVendor(vendorRepository.save(v));
    }

    @Transactional(readOnly = true)
    public List<ProcurementResponse.VendorResponse> listVendors() {
        return vendorRepository.findByTenantIdAndDeletedAtIsNull(resolveTenantId()).stream().map(this::mapVendor).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProcurementResponse.VendorResponse getVendor(UUID id) {
        return mapVendor(findProcurementVendorOrThrow(id));
    }

    @Transactional
    public ProcurementResponse.VendorResponse updateVendor(UUID id, ProcurementRequest.VendorRequest req) {
        Vendor v = findProcurementVendorOrThrow(id);
        v.setName(req.getName());
        v.setDescription(req.getDescription());
        v.setContactEmail(req.getContactEmail());
        v.setContactPhone(req.getContactPhone());
        v.setAddress(req.getAddress());
        v.setWebsite(req.getWebsite());
        return mapVendor(vendorRepository.save(v));
    }

    @Transactional
    public void deleteVendor(UUID id) {
        Vendor v = findProcurementVendorOrThrow(id);
        v.softDelete();
        vendorRepository.save(v);
    }

    // Contracts
    @Transactional
    public ProcurementResponse.ContractResponse createContract(ProcurementRequest.ContractRequest req) {
        Contract c = Contract.builder()
                .title(req.getTitle()).description(req.getDescription())
                .vendorId(req.getVendorId()).value(req.getValue())
                .startDate(req.getStartDate()).endDate(req.getEndDate())
                .terms(req.getTerms()).build();
        c.setTenantId(resolveTenantId());
        return mapContract(contractRepository.save(c));
    }

    @Transactional(readOnly = true)
    public List<ProcurementResponse.ContractResponse> listContracts() {
        return contractRepository.findByTenantIdAndDeletedAtIsNull(resolveTenantId()).stream().map(this::mapContract).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProcurementResponse.ContractResponse getContract(UUID id) {
        return mapContract(findContractOrThrow(id));
    }

    @Transactional
    public ProcurementResponse.ContractResponse updateContract(UUID id, ProcurementRequest.ContractRequest req) {
        Contract c = findContractOrThrow(id);
        c.setTitle(req.getTitle());
        c.setDescription(req.getDescription());
        c.setVendorId(req.getVendorId());
        c.setValue(req.getValue());
        c.setStartDate(req.getStartDate());
        c.setEndDate(req.getEndDate());
        c.setTerms(req.getTerms());
        return mapContract(contractRepository.save(c));
    }

    @Transactional
    public void deleteContract(UUID id) {
        Contract c = findContractOrThrow(id);
        c.softDelete();
        contractRepository.save(c);
    }

    private PurchaseRequest findPROrThrow(UUID id) {
        return prRepository.findById(id).filter(p -> !p.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("PurchaseRequest", id));
    }

    private PurchaseOrder findPOOrThrow(UUID id) {
        return poRepository.findById(id).filter(p -> !p.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("PurchaseOrder", id));
    }

    private Vendor findProcurementVendorOrThrow(UUID id) {
        return vendorRepository.findById(id).filter(v -> !v.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("ProcurementVendor", id));
    }

    private Contract findContractOrThrow(UUID id) {
        return contractRepository.findById(id).filter(c -> !c.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Contract", id));
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
