package com.orionops.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.util.StringUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Value("${keycloak.resourceserver.jwt.jwk-set-uri}")
    private String jwkSetUri;

    /** Symmetric JWT secret used in cloud profile (Render). Empty string means use JWK URI instead. */
    @Value("${app.auth.jwt-secret:}")
    private String jwtSecret;

    /** CORS origins — overridden in application-cloud.yml to include Vercel URL. */
    @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:3001,http://localhost:19006}")
    private List<String> allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/actuator/health",
                    "/actuator/health/**",
                    "/actuator/info",
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/v3/api-docs/**",
                    "/api/v1/auth/login",
                    "/v1/auth/login"
                ).permitAll()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(Customizer.withDefaults())
            );

        return http.build();
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        // Support both password-login (HMAC) and Keycloak (JWK) tokens
        JwtDecoder keycloakDecoder = null;
        try {
            keycloakDecoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
        } catch (Exception e) {
            // JWK endpoint not available, fall through to HMAC
        }

        if (StringUtils.hasText(jwtSecret)) {
            // HMAC decoder for password-login tokens
            // Must match the 32-byte key truncation in JwtTokenProvider
            byte[] secretBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
            byte[] keyBytes = new byte[32];
            System.arraycopy(secretBytes, 0, keyBytes, 0, Math.min(secretBytes.length, 32));
            SecretKeySpec key = new SecretKeySpec(keyBytes, "HmacSHA256");
            NimbusJwtDecoder hmacDecoder = NimbusJwtDecoder.withSecretKey(key).build();
            // Skip validation for password-login tokens (issuer is "orionops-local")
            hmacDecoder.setJwtValidator(jwt -> {});

            // If Keycloak decoder is available, create a delegating decoder that checks issuer
            if (keycloakDecoder != null) {
                final JwtDecoder finalKeycloakDecoder = keycloakDecoder;
                return token -> {
                    // Check if token is from password login or Keycloak based on issuer claim
                    try {
                        // First, do a basic decode to check the issuer
                        String[] parts = token.split("\\.");
                        if (parts.length == 3) {
                            String payload = parts[1];
                            payload += "=".repeat((4 - payload.length() % 4) % 4);
                            byte[] decoded = java.util.Base64.getUrlDecoder().decode(payload);
                            String json = new String(decoded, StandardCharsets.UTF_8);
                            if (json.contains("\"iss\":\"orionops-local\"")) {
                                // Password-login token - use HMAC
                                return hmacDecoder.decode(token);
                            }
                        }
                    } catch (Exception e) {
                        // If inspection fails, fall through to decoders
                    }

                    try {
                        // Try HMAC first (password-login tokens)
                        return hmacDecoder.decode(token);
                    } catch (Exception e1) {
                        try {
                            // Fall back to Keycloak (for SSO tokens)
                            return finalKeycloakDecoder.decode(token);
                        } catch (Exception e2) {
                            // Re-throw original error
                            throw e1;
                        }
                    }
                };
            }
            // Only HMAC available
            return hmacDecoder;
        }

        // Only Keycloak JWK available
        if (keycloakDecoder != null) {
            return keycloakDecoder;
        }

        // Fallback: dummy decoder (should not reach here in normal operation)
        throw new IllegalStateException("No JWT decoder available: set jwk-set-uri or jwt-secret");
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(List.of(
            "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
        ));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
