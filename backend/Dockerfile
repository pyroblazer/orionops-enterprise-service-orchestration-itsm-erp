# ---- Stage 1: Build ----
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

# Copy POM first to leverage Docker layer caching for dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and build
COPY src ./src
RUN mvn package -DskipTests -B

# ---- Stage 2: Runtime ----
FROM eclipse-temurin:21-jre-alpine

RUN addgroup -S orionops && adduser -S orionops -G orionops

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

RUN chown -R orionops:orionops /app

USER orionops

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
