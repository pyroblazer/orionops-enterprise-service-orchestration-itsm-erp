package com.orionops.modules.inventory.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LotTrackingService {

    @Transactional
    public void receiveLot(String sku, String lotNumber, String mfgDate, String expiryDate, BigDecimal quantity, UUID warehouseId) {
        log.info("Lot {} received for SKU {}: {} units", lotNumber, sku, quantity);
    }

    @Transactional
    public void allocateLotToOrder(UUID orderId, String sku, BigDecimal quantity) {
        log.info("Lot allocated to order {} for SKU {}: {} units", orderId, sku, quantity);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> flagExpiringLots(UUID tenantId) {
        return List.of();
    }

    @Transactional
    public void quarantineExpiredLot(UUID lotId) {
        log.info("Lot {} quarantined as expired", lotId);
    }
}
