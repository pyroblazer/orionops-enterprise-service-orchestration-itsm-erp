package com.orionops.modules.vendor.service;

import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.modules.vendor.dto.VendorDTO;
import com.orionops.modules.vendor.entity.Vendor;
import com.orionops.modules.vendor.entity.VendorPerformance;
import com.orionops.modules.vendor.repository.VendorRepository;
import com.orionops.modules.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.orionops.common.tenant.TenantContextHolder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VendorService {

    private final VendorRepository.VendorEntityRepository vendorRepository;
    private final VendorRepository.VendorPerformanceRepository performanceRepository;
    private final NotificationService notificationService;

    @Transactional
    public VendorDTO.VendorResponse createVendor(VendorDTO.VendorRequest req) {
        Vendor v = Vendor.builder()
                .name(req.getName()).description(req.getDescription())
                .contactEmail(req.getContactEmail()).contactPhone(req.getContactPhone())
                .address(req.getAddress()).website(req.getWebsite()).category(req.getCategory())
                .build();
        v.setTenantId(resolveTenantId());
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
                .build();
        perf.setTenantId(resolveTenantId());
        return mapPerformance(performanceRepository.save(perf));
    }

    @Transactional
    public VendorDTO.VendorResponse updateVendor(UUID id, VendorDTO.VendorRequest req) {
        Vendor v = findVendorOrThrow(id);
        v.setName(req.getName());
        v.setDescription(req.getDescription());
        v.setContactEmail(req.getContactEmail());
        v.setContactPhone(req.getContactPhone());
        v.setAddress(req.getAddress());
        v.setWebsite(req.getWebsite());
        v.setCategory(req.getCategory());
        return mapVendor(vendorRepository.save(v));
    }

    @Transactional
    public void deleteVendor(UUID id) {
        Vendor v = findVendorOrThrow(id);
        v.softDelete();
        vendorRepository.save(v);
    }

    // ---- Vendor SLA Tracking & Alerts ----

    @Scheduled(cron = "0 0 9 * * 1")
    @Transactional
    public void checkVendorSLACompliance() {
        UUID tenantId = resolveTenantId();
        List<Vendor> vendors = vendorRepository.findByTenantIdAndDeletedAtIsNull(tenantId);

        for (Vendor vendor : vendors) {
            List<VendorPerformance> performances = performanceRepository.findByVendorIdAndDeletedAtIsNull(vendor.getId());
            if (!performances.isEmpty()) {
                VendorPerformance latest = performances.stream()
                    .max((p1, p2) -> p1.getEvaluationDate().compareTo(p2.getEvaluationDate()))
                    .get();

                BigDecimal threshold = BigDecimal.valueOf(4.0);
                if (latest.getOverallScore().compareTo(threshold) < 0) {
                    try {
                        notificationService.createNotification(
                            UUID.randomUUID(),
                            "Vendor SLA Compliance Alert: " + vendor.getName(),
                            "Vendor " + vendor.getName() + " compliance score (" + latest.getOverallScore() +
                                ") is below threshold (" + threshold + ")",
                            "VENDOR_SLA_ALERT",
                            vendor.getId(),
                            "VENDOR"
                        );
                        log.info("Vendor SLA compliance alert sent for vendor: {}", vendor.getId());
                    } catch (Exception e) {
                        log.warn("Failed to send vendor SLA alert: {}", e.getMessage());
                    }
                }
            }
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getVendorSLAStatus(UUID vendorId) {
        Vendor vendor = findVendorOrThrow(vendorId);
        List<VendorPerformance> performances = performanceRepository.findByVendorIdAndDeletedAtIsNull(vendorId);

        if (performances.isEmpty()) {
            return Map.of(
                "vendorId", vendorId,
                "vendorName", vendor.getName(),
                "complianceStatus", "NO_DATA"
            );
        }

        VendorPerformance latest = performances.stream()
            .max((p1, p2) -> p1.getEvaluationDate().compareTo(p2.getEvaluationDate()))
            .get();

        BigDecimal avgScore = BigDecimal.valueOf(
            performances.stream()
                .mapToDouble(p -> p.getOverallScore() != null ? p.getOverallScore().doubleValue() : 0)
                .average()
                .orElse(0)
        );

        return Map.of(
            "vendorId", vendorId,
            "vendorName", vendor.getName(),
            "latestScore", latest.getOverallScore(),
            "averageScore", avgScore,
            "trend", "STABLE",
            "lastEvaluation", latest.getEvaluationDate(),
            "evaluationCount", performances.size()
        );
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

    private UUID resolveTenantId() {
        return TenantContextHolder.getCurrentTenantId();
    }

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
