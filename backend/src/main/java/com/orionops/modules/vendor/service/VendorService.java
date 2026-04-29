package com.orionops.modules.vendor.service;

import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.modules.vendor.dto.VendorDTO;
import com.orionops.modules.vendor.entity.Vendor;
import com.orionops.modules.vendor.entity.VendorPerformance;
import com.orionops.modules.vendor.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VendorService {

    private final VendorRepository.VendorEntityRepository vendorRepository;
    private final VendorRepository.VendorPerformanceRepository performanceRepository;

    @Transactional
    public VendorDTO.VendorResponse createVendor(VendorDTO.VendorRequest req) {
        Vendor v = Vendor.builder()
                .name(req.getName()).description(req.getDescription())
                .contactEmail(req.getContactEmail()).contactPhone(req.getContactPhone())
                .address(req.getAddress()).website(req.getWebsite()).category(req.getCategory())
                .tenantId(resolveTenantId()).build();
        return mapVendor(vendorRepository.save(v));
    }

    @Transactional(readOnly = true)
    public List<VendorDTO.VendorResponse> listVendors() {
        return vendorRepository.findByTenantIdAndDeletedAtIsNull(resolveTenantId()).stream().map(this::mapVendor).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VendorDTO.VendorResponse getVendor(UUID id) {
        return mapVendor(findVendorOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<VendorDTO.PerformanceResponse> getVendorPerformance(UUID vendorId) {
        findVendorOrThrow(vendorId);
        return performanceRepository.findByVendorIdAndDeletedAtIsNull(vendorId).stream().map(this::mapPerformance).collect(Collectors.toList());
    }

    @Transactional
    public VendorDTO.PerformanceResponse recordPerformance(UUID vendorId, VendorDTO.PerformanceRequest req) {
        findVendorOrThrow(vendorId);
        BigDecimal overall = calculateOverallScore(req.getQualityScore(), req.getDeliveryScore(), req.getResponsivenessScore());
        VendorPerformance perf = VendorPerformance.builder()
                .vendorId(vendorId).qualityScore(req.getQualityScore())
                .deliveryScore(req.getDeliveryScore()).responsivenessScore(req.getResponsivenessScore())
                .overallScore(overall).evaluationDate(LocalDateTime.now())
                .evaluator(req.getEvaluator()).comments(req.getComments())
                .tenantId(resolveTenantId()).build();
        return mapPerformance(performanceRepository.save(perf));
    }

    @Transactional
    public void deleteVendor(UUID id) {
        Vendor v = findVendorOrThrow(id);
        v.softDelete();
        vendorRepository.save(v);
    }

    private Vendor findVendorOrThrow(UUID id) {
        return vendorRepository.findById(id).filter(v -> !v.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor", id));
    }

    private BigDecimal calculateOverallScore(BigDecimal quality, BigDecimal delivery, BigDecimal responsiveness) {
        int count = 0;
        BigDecimal total = BigDecimal.ZERO;
        if (quality != null) { total = total.add(quality); count++; }
        if (delivery != null) { total = total.add(delivery); count++; }
        if (responsiveness != null) { total = total.add(responsiveness); count++; }
        return count > 0 ? total.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
    }

    private UUID resolveTenantId() { return UUID.fromString("00000000-0000-0000-0000-000000000001"); }

    private VendorDTO.VendorResponse mapVendor(Vendor v) {
        return VendorDTO.VendorResponse.builder().id(v.getId()).name(v.getName())
                .description(v.getDescription()).contactEmail(v.getContactEmail())
                .contactPhone(v.getContactPhone()).address(v.getAddress())
                .website(v.getWebsite()).category(v.getCategory())
                .overallRating(v.getOverallRating()).active(v.isActive()).createdAt(v.getCreatedAt()).build();
    }

    private VendorDTO.PerformanceResponse mapPerformance(VendorPerformance p) {
        return VendorDTO.PerformanceResponse.builder().id(p.getId()).vendorId(p.getVendorId())
                .qualityScore(p.getQualityScore()).deliveryScore(p.getDeliveryScore())
                .responsivenessScore(p.getResponsivenessScore()).overallScore(p.getOverallScore())
                .evaluationDate(p.getEvaluationDate()).evaluator(p.getEvaluator())
                .comments(p.getComments()).createdAt(p.getCreatedAt()).build();
    }
}
