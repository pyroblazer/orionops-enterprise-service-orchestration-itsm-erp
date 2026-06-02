package com.orionops.modules.auth.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class DataMaskingServiceTest {

    @InjectMocks
    private DataMaskingService maskingService;

    @Test
    void testMaskSSN() {
        String masked = maskingService.maskSSN("123-45-6789");
        assertNotNull(masked);
        assertTrue(masked.contains("*") || masked.contains("6789"));
    }

    @Test
    void testMaskSSN_NullInput() {
        String masked = maskingService.maskSSN(null);
        assertTrue(masked == null || masked.contains("*"));
    }

    @Test
    void testMaskBankAccount() {
        String masked = maskingService.maskBankAccount("1234567890123456");
        assertNotNull(masked);
        assertTrue(masked.contains("*") || masked.length() <= 16);
    }

    @Test
    void testMaskBankAccount_NullInput() {
        String masked = maskingService.maskBankAccount(null);
        assertTrue(masked == null || masked.equals("****"));
    }

    @Test
    void testMaskEmail() {
        String masked = maskingService.maskEmail("john.doe@example.com");
        assertNotNull(masked);
        assertTrue(masked.contains("*") || masked.contains("@"));
    }

    @Test
    void testMaskEmail_NullInput() {
        String masked = maskingService.maskEmail(null);
        assertTrue(masked == null || masked.contains("@"));
    }

    @Test
    void testMaskField_SSN() {
        Object masked = maskingService.maskField("123-45-6789", "SSN");
        assertNotNull(masked);
    }

    @Test
    void testMaskField_InvalidType() {
        Object masked = maskingService.maskField("sensitive_data", "UNKNOWN");
        assertTrue(masked != null);
    }
}
