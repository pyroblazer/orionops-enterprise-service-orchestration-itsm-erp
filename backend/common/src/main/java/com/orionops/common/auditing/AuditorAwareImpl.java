package com.orionops.common.auditing;

import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Provides the current auditor (username) for JPA auditing fields
 * (@CreatedBy, @LastModifiedBy). Extracts the principal from the
 * Spring Security context, which is populated by the JWT authentication filter.
 * Falls back to "system" when no authenticated user is present (e.g., system processes).
 */
@Component
public class AuditorAwareImpl implements AuditorAware<String> {

    private static final String SYSTEM_AUDITOR = "system";

    @Override
    public Optional<String> getCurrentAuditor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.of(SYSTEM_AUDITOR);
        }

        String principalName = authentication.getName();
        if (principalName == null || principalName.isBlank()) {
            return Optional.of(SYSTEM_AUDITOR);
        }

        return Optional.of(principalName);
    }
}
