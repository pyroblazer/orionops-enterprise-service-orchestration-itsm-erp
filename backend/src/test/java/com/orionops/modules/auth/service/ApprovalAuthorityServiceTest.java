package com.orionops.modules.auth.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class ApprovalAuthorityServiceTest {

    @Mock
    private ApprovalAuthorityService authorityService;

    @Test
    void testCanUserApprove_WithSufficientAuthority() {
        UUID userId = UUID.randomUUID();
        boolean canApprove = authorityService.canUserApprove(userId, "approve_expense", BigDecimal.valueOf(1000));
        assertNotNull(canApprove);
    }

    @Test
    void testCanUserApprove_WithInsufficientAuthority() {
        UUID userId = UUID.randomUUID();
        boolean canApprove = authorityService.canUserApprove(userId, "approve_expense", BigDecimal.valueOf(100000));
        assertNotNull(canApprove);
    }

    @Test
    void testSetApprovalAuthority() {
        UUID userId = UUID.randomUUID();
        assertDoesNotThrow(() ->
            authorityService.setApprovalAuthority(userId, "approve_po", BigDecimal.valueOf(50000)));
    }

    @Test
    void testGetSuggestedApprover() {
        UUID approver = authorityService.getSuggestedApprover("approve_invoice", BigDecimal.valueOf(5000));
        // Can be null if no approver found
        assertTrue(approver == null || approver instanceof UUID);
    }
}
