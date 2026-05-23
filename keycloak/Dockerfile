FROM quay.io/keycloak/keycloak:24.0.1

# Copy the OrionOps realm configuration for auto-import
COPY backend/src/main/resources/keycloak/ /opt/keycloak/data/import/

# Build Keycloak to optimize for production
RUN /opt/keycloak/bin/kc.sh build

# Start Keycloak in development mode with realm import enabled
# For production, use: start --https-protocols=TLSv1.3 --proxy=edge
CMD ["start-dev", "--import-realm", "--http-port=8080"]
