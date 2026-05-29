# ---- Stage 1: Build ----
# Render cache bust: v2
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

# Copy POM first to leverage Docker layer caching for dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and build
COPY src ./src
RUN mvn package -DskipTests -Dmaven.test.skip=true -B \
    && rm -rf target/original-*.jar

# ---- Stage 2: Runtime ----
FROM eclipse-temurin:21-jre-alpine

RUN addgroup -S orionops && adduser -S orionops -G orionops

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

RUN chown -R orionops:orionops /app

USER orionops

EXPOSE 8080

# JVM tuned for 512MB free tier: heap capped at 384m via JAVA_OPTS
# All config (DB URL, credentials, Redis) comes from Render env vars
ENTRYPOINT ["sh", "-c", \
  "exec java \
    -XX:+UseG1GC \
    -XX:MaxGCPauseMillis=200 \
    -XX:+ParallelRefProcEnabled \
    -XX:MaxRAMPercentage=75.0 \
    ${JAVA_OPTS} \
    -jar app.jar"]
