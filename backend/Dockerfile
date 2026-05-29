# ---- Stage 1: Build ----
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

# Copy POM first to leverage Docker layer caching for dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and build
COPY src ./src
RUN mvn package -DskipTests -Dmaven.test.skip=true -B

# ---- Stage 2: Runtime ----
FROM eclipse-temurin:21-jre-alpine

RUN addgroup -S orionops && adduser -S orionops -G orionops

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

RUN chown -R orionops:orionops /app

USER orionops

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -Xmx350m -Xms128m -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:+ParallelRefProcEnabled -XX:+UnlockDiagnosticVMOptions -XX:G1SummarizeRSetStatsPeriod=1 -Djdk.attach.allowAttachSelf=false ${JAVA_OPTS} -Dspring.datasource.url=jdbc:postgresql://ep-patient-star-aozxgghu-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require -Dspring.datasource.username=neondb_owner -jar app.jar"]
