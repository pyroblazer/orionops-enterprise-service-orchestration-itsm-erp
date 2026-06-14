package com.orionops.modules.request.dto;

import com.orionops.modules.request.entity.ServiceRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceRequestResponse {

    private UUID id;
    private String title;
    private String description;
    private ServiceRequest.RequestStatus status;
    private String category;
    private UUID requesterId;
    private UUID assigneeId;
    private UUID approverId;
    private UUID serviceId;
    private String fulfillmentNotes;
    private LocalDateTime submittedAt;
    private LocalDateTime approvedAt;
    private LocalDateTime fulfilledAt;
    private LocalDateTime closedAt;
    private UUID tenantId;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
