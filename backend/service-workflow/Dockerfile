FROM eclipse-temurin:21-jre-alpine

RUN addgroup -S orionops && adduser -S orionops -G orionops

WORKDIR /app

COPY service-workflow/target/*.jar app.jar

RUN chown -R orionops:orionops /app

USER orionops

EXPOSE 8080

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
