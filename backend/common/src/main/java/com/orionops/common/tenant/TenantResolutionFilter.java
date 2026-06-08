package com.orionops.common.tenant;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Servlet filter that extracts the tenant ID from the current JWT token
 * and stores it in {@link TenantContextHolder} for the duration of the request.
 *
 * <p>The filter runs early (highest precedence) so that all downstream services
 * can call {@link TenantContextHolder#getCurrentTenantId()} without depending
 * on the security context directly.</p>
 *
 * <p>Order is set to {@code Ordered.HIGHEST_PRECEDENCE + 10} to run just after
 * Spring Security's filter chain has established the authentication.</p>
 */
@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class TenantResolutionFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            resolveAndSetTenant();
            filterChain.doFilter(request, response);
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * Reads the JWT from the security context, extracts the {@code tenant_id} claim,
     * and populates the TenantContextHolder. Falls back to the default tenant if
     * the claim is missing or no JWT is present (system/async operations).
     */
    private void resolveAndSetTenant() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            String tenantIdStr = jwt.getClaimAsString("tenant_id");
            if (tenantIdStr != null && !tenantIdStr.isBlank()) {
                try {
                    UUID tenantId = UUID.fromString(tenantIdStr);
                    TenantContextHolder.setCurrentTenantId(tenantId);
                    log.debug("Tenant context set to {} from JWT", tenantId);
                    return;
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid tenant_id claim in JWT: '{}'", tenantIdStr);
                }
            }
        }
        // No JWT or missing claim — default tenant is used automatically by TenantContextHolder
        log.debug("No tenant_id in JWT; using default tenant");
    }
}
