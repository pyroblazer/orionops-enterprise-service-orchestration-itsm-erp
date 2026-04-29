package com.orionops.modules.billing.service;

import com.orionops.common.event.EventPublisher;
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
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BillingService {

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
                .tenantId(resolveTenantId()).build();
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
        String invoiceNumber = "INV-" + System.currentTimeMillis();

        BillingRecord record = BillingRecord.builder()
                .invoiceNumber(invoiceNumber).amount(total).taxAmount(tax)
                .periodStart(req.getPeriodStart()).periodEnd(req.getPeriodEnd())
                .generatedAt(LocalDateTime.now()).tenantId(resolveTenantId()).build();
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
    public List<BillingDTO.BillingRecordResponse> listBillingRecords() {
        return billingRepository.findByTenantIdAndDeletedAtIsNull(resolveTenantId()).stream().map(this::mapBillingRecord).collect(Collectors.toList());
    }

    @Transactional
    public BillingDTO.CostModelResponse createCostModel(BillingDTO.CostModelRequest req) {
        CostModel cm = CostModel.builder()
                .name(req.getName()).description(req.getDescription()).serviceId(req.getServiceId())
                .pricingType(req.getPricingType() != null ? CostModel.PricingType.valueOf(req.getPricingType()) : CostModel.PricingType.FIXED)
                .fixedPrice(req.getFixedPrice()).unitPrice(req.getUnitPrice())
                .tenantId(resolveTenantId()).build();
        return mapCostModel(costModelRepository.save(cm));
    }

    @Transactional(readOnly = true)
    public List<BillingDTO.CostModelResponse> listCostModels() {
        return costModelRepository.findByTenantIdAndDeletedAtIsNull(resolveTenantId()).stream().map(this::mapCostModel).collect(Collectors.toList());
    }

    private UUID resolveTenantId() { return UUID.fromString("00000000-0000-0000-0000-000000000001"); }

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
