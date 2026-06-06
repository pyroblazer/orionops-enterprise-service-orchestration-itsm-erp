# ---- Stage 1: Build ----
FROM maven:3.9-eclipse-temurin-21 AS build

# Force cache invalidation for source changes
ARG CACHEBUST=1

WORKDIR /app

# Copy POM first to leverage Docker layer caching for dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and build — always fresh due to CACHEBUST arg above
COPY src ./src
RUN mvn package -DskipTests -Dmaven.test.skip=true -B \
    && rm -rf target/original-*.jar \
    && echo "Built JAR contents:" \
    && jar tf target/*.jar | grep "db/migration" | sort

# ---- Stage 2: Runtime ----
FROM eclipse-temurin:21-jre-alpine

RUN addgroup -S orionops && adduser -S orionops -G orionops

WORKDIR /app

# Service profile determines which beans load (cloud-api, cloud-workflow, etc.)
ARG SERVICE_PROFILE=cloud-api
ENV SPRING_PROFILES_ACTIVE=cloud,${SERVICE_PROFILE}

COPY --from=build /app/target/*.jar app.jar

RUN chown -R orionops:orionops /app

USER orionops

EXPOSE 8080

# JVM tuned for 512MB free tier: heap+metaspace capped well below container limit
# All config (DB URL, credentials, Redis) comes from Render env vars
ENTRYPOINT ["sh", "-c", \
  "exec java \
    -XX:+UseG1GC \
    -XX:MaxGCPauseMillis=200 \
    -XX:+ParallelRefProcEnabled \
    -XX:+UseStringDeduplication \
    -Xms64m \
    -Xmx256m \
    -XX:MaxMetaspaceSize=128m \
    -XX:ReservedCodeCacheSize=64m \
    ${JAVA_OPTS} \
    -jar app.jar"]
