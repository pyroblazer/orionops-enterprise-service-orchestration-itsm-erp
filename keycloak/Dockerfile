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

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start-dev", "--import-realm"]
