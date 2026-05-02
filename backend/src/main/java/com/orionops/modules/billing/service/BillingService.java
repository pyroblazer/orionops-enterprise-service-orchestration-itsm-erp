package com.orionops.modules.billing.service;

import com.orionops.common.event.EventPublisher;
import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.modules.billing.dto.BillingDTO;
import com.orionops.modules.billing.entity.BillingRecord;
import com.orionops.modules.billing.entity.CostModel;
import com.orionops.modules.billing.entity.ServiceUsage;
import com.orionops.modules.billing.event.InvoiceGeneratedEvent;
import com.orionops.modules.billing.event.UsageRecordedEvent;
import com.orionops.modules.billing.repository.BillingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BillingService {

    private static final AtomicLong INVOICE_SEQ = new AtomicLong(0);

    private final BillingRepository.ServiceUsageRepository usageRepository;
    private final BillingRepository.BillingRecordRepository billingRepository;
    private final BillingRepository.CostModelRepository costModelRepository;
    private final EventPublisher eventPublisher;

    @Transactional
    public BillingDTO.UsageResponse recordUsage(BillingDTO.UsageRequest req) {
        BigDecimal totalCost = req.getQuantity().multiply(req.getUnitCost() != null ? req.getUnitCost() : BigDecimal.ONE);
        ServiceUsage usage = ServiceUsage.builder()
                .serviceId(req.getServiceId()).tenantEntityId(req.getTenantEntityId())
                .usageType(req.getUsageType()).quantity(req.getQuantity())
                .unitCost(req.getUnitCost()).totalCost(totalCost)
                .usageDate(LocalDateTime.now()).description(req.getDescription())
                .build();
        usage.setTenantId(resolveTenantId());
        ServiceUsage saved = usageRepository.save(usage);

        eventPublisher.publish(UsageRecordedEvent.builder()
                .aggregateId(saved.getId()).usageId(saved.getId())
                .serviceId(req.getServiceId()).totalCost(totalCost).build());

        return mapUsage(saved);
    }

    @Transactional
    public BillingDTO.BillingRecordResponse generateInvoice(BillingDTO.GenerateInvoiceRequest req) {
        List<ServiceUsage> usages = usageRepository.findByPeriod(resolveTenantId(), req.getPeriodStart(), req.getPeriodEnd());
        BigDecimal total = usages.stream().map(ServiceUsage::getTotalCost).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal tax = total.multiply(BigDecimal.valueOf(0.1)); // 10% tax
        String invoiceNumber = "INV-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + "-" + INVOICE_SEQ.incrementAndGet();

        BillingRecord record = BillingRecord.builder()
                .invoiceNumber(invoiceNumber).amount(total).taxAmount(tax)
                .periodStart(req.getPeriodStart()).periodEnd(req.getPeriodEnd())
                .generatedAt(LocalDateTime.now()).build();
        record.setTenantId(resolveTenantId());
        BillingRecord saved = billingRepository.save(record);

        eventPublisher.publish(InvoiceGeneratedEvent.builder()
                .aggregateId(saved.getId()).billingRecordId(saved.getId())
                .invoiceNumber(invoiceNumber).amount(total).build());

        return mapBillingRecord(saved);
    }

    @Transactional(readOnly = true)
    public List<BillingDTO.UsageResponse> listUsages() {
        return usageRepository.findByTenantIdAndDeletedAtIsNull(resolveTenantId()).stream().map(this::mapUsage).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BillingDTO.UsageResponse getUsage(UUID id) {
        return mapUsage(findUsageOrThrow(id));
    }

    @Transactional
    public BillingDTO.UsageResponse updateUsage(UUID id, BillingDTO.UsageRequest req) {
        ServiceUsage usage = findUsageOrThrow(id);
        usage.setServiceId(req.getServiceId());
        usage.setTenantEntityId(req.getTenantEntityId());
        usage.setUsageType(req.getUsageType());
        usage.setQuantity(req.getQuantity());
        usage.setUnitCost(req.getUnitCost());
        usage.setDescription(req.getDescription());
        if (req.getQuantity() != null && req.getUnitCost() != null) {
            usage.setTotalCost(req.getQuantity().multiply(req.getUnitCost()));
        }
        return mapUsage(usageRepository.save(usage));
    }

    @Transactional
    public void deleteUsage(UUID id) {
        ServiceUsage usage = findUsageOrThrow(id);
        usage.softDelete();
        usageRepository.save(usage);
    }

    @Transactional(readOnly = true)
    public List<BillingDTO.BillingRecordResponse> listBillingRecords() {
        return billingRepository.findByTenantIdAndDeletedAtIsNull(resolveTenantId()).stream().map(this::mapBillingRecord).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BillingDTO.BillingRecordResponse getBillingRecord(UUID id) {
        return mapBillingRecord(findBillingRecordOrThrow(id));
    }

    @Transactional
    public void deleteBillingRecord(UUID id) {
        BillingRecord record = findBillingRecordOrThrow(id);
        record.softDelete();
        billingRepository.save(record);
    }

    @Transactional
    public BillingDTO.CostModelResponse createCostModel(BillingDTO.CostModelRequest req) {
        CostModel cm = CostModel.builder()
                .name(req.getName()).description(req.getDescription()).serviceId(req.getServiceId())
                .pricingType(req.getPricingType() != null ? CostModel.PricingType.valueOf(req.getPricingType()) : CostModel.PricingType.FIXED)
                .fixedPrice(req.getFixedPrice()).unitPrice(req.getUnitPrice())
                .build();
        cm.setTenantId(resolveTenantId());
        return mapCostModel(costModelRepository.save(cm));
    }

    @Transactional(readOnly = true)
    public List<BillingDTO.CostModelResponse> listCostModels() {
        return costModelRepository.findByTenantIdAndDeletedAtIsNull(resolveTenantId()).stream().map(this::mapCostModel).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BillingDTO.CostModelResponse getCostModel(UUID id) {
        return mapCostModel(findCostModelOrThrow(id));
    }

    @Transactional
    public BillingDTO.CostModelResponse updateCostModel(UUID id, BillingDTO.CostModelRequest req) {
        CostModel cm = findCostModelOrThrow(id);
        cm.setName(req.getName());
        cm.setDescription(req.getDescription());
        cm.setServiceId(req.getServiceId());
        if (req.getPricingType() != null) {
            cm.setPricingType(CostModel.PricingType.valueOf(req.getPricingType()));
        }
        cm.setFixedPrice(req.getFixedPrice());
        cm.setUnitPrice(req.getUnitPrice());
        return mapCostModel(costModelRepository.save(cm));
    }

    @Transactional
    public void deleteCostModel(UUID id) {
        CostModel cm = findCostModelOrThrow(id);
        cm.softDelete();
        costModelRepository.save(cm);
    }

    private UUID resolveTenantId() { return UUID.fromString("00000000-0000-0000-0000-000000000001"); }

    private ServiceUsage findUsageOrThrow(UUID id) {
        return usageRepository.findById(id).filter(u -> !u.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("ServiceUsage", id));
    }

    private BillingRecord findBillingRecordOrThrow(UUID id) {
        return billingRepository.findById(id).filter(r -> !r.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("BillingRecord", id));
    }

    private CostModel findCostModelOrThrow(UUID id) {
        return costModelRepository.findById(id).filter(c -> !c.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("CostModel", id));
    }

    private BillingDTO.UsageResponse mapUsage(ServiceUsage u) {
        return BillingDTO.UsageResponse.builder().id(u.getId()).serviceId(u.getServiceId())
                .tenantEntityId(u.getTenantEntityId()).usageType(u.getUsageType())
                .quantity(u.getQuantity()).unitCost(u.getUnitCost()).totalCost(u.getTotalCost())
                .usageDate(u.getUsageDate()).description(u.getDescription()).createdAt(u.getCreatedAt()).build();
    }

    private BillingDTO.BillingRecordResponse mapBillingRecord(BillingRecord r) {
        return BillingDTO.BillingRecordResponse.builder().id(r.getId()).invoiceNumber(r.getInvoiceNumber())
                .amount(r.getAmount()).taxAmount(r.getTaxAmount()).periodStart(r.getPeriodStart())
                .periodEnd(r.getPeriodEnd()).status(r.getStatus().name())
                .generatedAt(r.getGeneratedAt()).paidAt(r.getPaidAt()).createdAt(r.getCreatedAt()).build();
    }

    private BillingDTO.CostModelResponse mapCostModel(CostModel c) {
        return BillingDTO.CostModelResponse.builder().id(c.getId()).name(c.getName())
                .description(c.getDescription()).serviceId(c.getServiceId())
                .pricingType(c.getPricingType() != null ? c.getPricingType().name() : null)
                .fixedPrice(c.getFixedPrice()).unitPrice(c.getUnitPrice())
                .active(c.isActive()).createdAt(c.getCreatedAt()).build();
    }
}
