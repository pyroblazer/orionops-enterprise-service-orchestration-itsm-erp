package com.orionops.common.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChangeEventPayload {
    private UUID changeId;
    private String title;
    private String description;
    private String status;
    private UUID approvedBy;
    private UUID rejectedBy;
    private String rejectionReason;
    private UUID implementedBy;
    private String implementationNotes;
    private UUID assigneeId;
    private UUID requesterId;
    private UUID approverId;
}
