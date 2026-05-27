FROM quay.io/keycloak/keycloak:24.0.1

# Copy the OrionOps realm configuration for auto-import
# Build context must be repo root for this path to resolve
COPY backend/src/main/resources/keycloak/ /opt/keycloak/data/import/

# Build optimized distribution
RUN /opt/keycloak/bin/kc.sh build

# Enable health endpoint for Render health checks
ENV KC_HEALTH_ENABLED=true
# Bind HTTP port (Render terminates TLS at edge)
ENV KC_HTTP_ENABLED=true
ENV KC_HTTP_PORT=8080
# Proxy headers for Render's load balancer (replaces deprecated --proxy)
ENV KC_PROXY_HEADERS=xforwarded

EXPOSE 8080

ENTRYPOINT ["/bin/sh", "-c"]
CMD ["export KC_DB=postgres KC_DB_URL='jdbc:postgresql://ep-patient-star-aozxgghu-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' KC_DB_USERNAME='neondb_owner' KC_DB_SCHEMA='keycloak' && exec /opt/keycloak/bin/kc.sh start-dev --import-realm"]
