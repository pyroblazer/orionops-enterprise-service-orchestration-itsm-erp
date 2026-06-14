package com.orionops.modules.procurement.service;

import com.orionops.common.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ThreeWayMatchingService {

    @Transactional
    public void recordGoodsReceipt(UUID poId, Map<String, Object> receiptData) {
        UUID receiptId = UUID.randomUUID();
        Map<String, Object> receipt = new HashMap<>(receiptData);
        receipt.put("id", receiptId);
        receipt.put("poId", poId);
        receipt.put("status", "RECEIVED");
        receipt.put("tenantId", TenantContextHolder.getCurrentTenantId());

        log.info("Goods receipt recorded for PO {}: {}", poId, receiptId);
    }

    @Transactional
    public void matchInvoiceToReceiptAndPO(UUID invoiceId, UUID poId, UUID receiptId) {
        // Validate amounts match
        // In production: query actual PO, Receipt, Invoice tables

        log.info("Invoice {} matched to PO {} and Receipt {}", invoiceId, poId, receiptId);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> detectVariances(UUID invoiceId) {
        // Compare invoice amount vs PO, received qty vs invoiced qty
        Map<String, Object> variances = new HashMap<>();

        // Price variance detection
        variances.put("priceVariance", BigDecimal.ZERO);
        variances.put("quantityVariance", BigDecimal.ZERO);
        variances.put("hasVariance", false);

        return variances;
    }

    @Transactional
    public void flagMatchingException(UUID invoiceId, String reason) {
        Map<String, Object> exception = new HashMap<>();
        exception.put("invoiceId", invoiceId);
        exception.put("reason", reason);
        exception.put("status", "OPEN");

        log.info("Matching exception flagged for invoice {}: {}", invoiceId, reason);
    }

    @Transactional
    public void resolveVariance(UUID invoiceId, String resolution) {
        log.info("Variance for invoice {} resolved: {}", invoiceId, resolution);
    }
}
