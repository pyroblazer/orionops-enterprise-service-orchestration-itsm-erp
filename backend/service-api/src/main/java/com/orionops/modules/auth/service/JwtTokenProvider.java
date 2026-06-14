package com.orionops.modules.auth.service;

import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSSigner;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.orionops.modules.auth.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Generates HMAC-SHA256 signed JWTs for local authentication.
 * Uses Nimbus JOSE+JWT (already on classpath via spring-boot-starter-oauth2-resource-server).
 * The issued tokens are compatible with the existing SecurityConfig JWT decoder.
 */
@Component
public class JwtTokenProvider {

    @Value("${app.auth.jwt-secret:}")
    private String jwtSecret;

    @Value("${app.auth.jwt-expiration:1800}")
    private long jwtExpirationSeconds;

    @Value("${app.auth.refresh-token-expiration:604800}")
    private long refreshTokenExpirationSeconds;

    /**
     * Generates a signed JWT for the given user.
     * The subject claim is set to the user's keycloakId so that
     * AuthService.getCurrentUser() can look up the user via findByKeycloakId().
     */
    public String generateToken(User user) throws Exception {
        byte[] secretBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        // HMAC-SHA256 requires at least 256 bits (32 bytes)
        byte[] keyBytes = new byte[32];
        System.arraycopy(secretBytes, 0, keyBytes, 0, Math.min(secretBytes.length, 32));

        JWSSigner signer = new MACSigner(keyBytes);

        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtExpirationSeconds * 1000);

        Map<String, Object> realmAccess = new HashMap<>();
        realmAccess.put("roles", List.copyOf(user.getRoles()));

        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .subject(user.getKeycloakId())
                .claim("preferred_username", user.getUsername())
                .claim("email", user.getEmail())
                .claim("given_name", user.getFirstName())
                .claim("family_name", user.getLastName())
                .claim("realm_access", realmAccess)
                .claim("groups", List.copyOf(user.getGroups()))
                .issuer("orionops-local")
                .issueTime(now)
                .expirationTime(expiry)
                .build();

        SignedJWT signedJWT = new SignedJWT(
                new JWSHeader.Builder(JWSAlgorithm.HS256)
                        .type(JOSEObjectType.JWT)
                        .build(),
                claims);

        signedJWT.sign(signer);
        return signedJWT.serialize();
    }

    /**
     * Generates a refresh token with longer expiration time.
     */
    public String generateRefreshToken(User user) throws Exception {
        byte[] secretBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        byte[] keyBytes = new byte[32];
        System.arraycopy(secretBytes, 0, keyBytes, 0, Math.min(secretBytes.length, 32));

        JWSSigner signer = new MACSigner(keyBytes);

        Date now = new Date();
        Date expiry = new Date(now.getTime() + refreshTokenExpirationSeconds * 1000);

        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .subject(user.getKeycloakId())
                .claim("type", "refresh")
                .issuer("orionops-local")
                .issueTime(now)
                .expirationTime(expiry)
                .build();

        SignedJWT signedJWT = new SignedJWT(
                new JWSHeader.Builder(JWSAlgorithm.HS256)
                        .type(JOSEObjectType.JWT)
                        .build(),
                claims);

        signedJWT.sign(signer);
        return signedJWT.serialize();
    }

    public long getExpirationSeconds() {
        return jwtExpirationSeconds;
    }

    public long getRefreshTokenExpirationSeconds() {
        return refreshTokenExpirationSeconds;
    }
}
