FROM eclipse-temurin:21-jre-alpine

RUN addgroup -S orionops && adduser -S orionops -G orionops

WORKDIR /app

COPY service-worker/target/*.jar app.jar

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
    -Xmx192m \
    -XX:MaxMetaspaceSize=96m \
    -XX:ReservedCodeCacheSize=48m \
    ${JAVA_OPTS} \
    -jar app.jar"]
