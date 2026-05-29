package com.orionops.modules.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class DataMaskingService {

    @Transactional(readOnly = true)
    public String maskSSN(String ssn) {
        if (ssn == null || ssn.length() < 4) return "***-**-****";
        return "***-**-" + ssn.substring(ssn.length() - 4);
    }

    @Transactional(readOnly = true)
    public String maskBankAccount(String account) {
        if (account == null || account.length() < 4) return "****";
        return account.substring(0, 2) + "***" + account.substring(account.length() - 2);
    }

    @Transactional(readOnly = true)
    public String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***@***.***";
        String[] parts = email.split("@");
        String local = parts[0];
        String domain = parts[1];
        return local.substring(0, 1) + "***@" + domain;
    }

    @Transactional(readOnly = true)
    public Object maskField(Object value, String fieldType) {
        if (value == null) return null;
        return switch (fieldType) {
            case "SSN" -> maskSSN((String) value);
            case "BANK_ACCOUNT" -> maskBankAccount((String) value);
            case "EMAIL" -> maskEmail((String) value);
            default -> value;
        };
    }
}
