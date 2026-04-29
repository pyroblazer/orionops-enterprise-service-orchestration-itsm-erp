package com.orionops.modules.billing.event;

import com.orionops.common.event.BaseEvent;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class InvoiceGeneratedEvent extends BaseEvent {

    @Builder.Default
    private final String eventType = "INVOICE_GENERATED";
    @Builder.Default
    private final String aggregateType = "billing_record";

    private UUID billingRecordId;
    private String invoiceNumber;
    private BigDecimal amount;
}
