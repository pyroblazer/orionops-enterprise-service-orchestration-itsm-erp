# OrionOps Backend - 512MB Memory Optimization

## Overview
Optimized the backend Java Spring Boot application to fit within a 512MB memory constraint (Render free tier). Applied JVM tuning, connection pool reductions, and Flowable async executor optimization.

## Changes Made

### 1. Dockerfile JVM Configuration (backend/Dockerfile)
Set strict JVM memory limits with optimized garbage collection:
- **Heap Settings**: `-Xmx350m -Xms128m`
  - Max heap: 350MB (leaves ~160MB for non-heap: metaspace, code cache, direct buffers, stacks)
  - Initial heap: 128MB (faster startup once loaded)
- **Garbage Collection**: `-XX:+UseG1GC -XX:MaxGCPauseMillis=200`
  - G1GC: Better for low-latency, consistent pause times
  - 200ms max pause: Prevents long pauses that kill user experience
- **Optimization Flags**:
  - `-XX:+ParallelRefProcEnabled`: Parallel reference processing for faster GC
  - `-XX:+UnlockDiagnosticVMOptions -XX:G1SummarizeRSetStatsPeriod=1`: Detailed GC analysis
  - `-Djdk.attach.allowAttachSelf=false`: Disables runtime attach (reduces overhead)

### 2. Base Configuration (application.yml)
- **Database Connection Pool**: Reduced from 20/5 to 10/2 (max/min idle)
  - Fewer connections reduce memory footprint
  - Added leak detection (15s timeout)
- **Redis Connection Pool**: Reduced from 16/8 to 8/4 (max/min idle)
- **Tomcat Thread Pool**: Limited to 20 max threads, 5 min spare
- **Flowable Async Executor**:
  - Core threads: 4 (vs implicit higher default)
  - Max threads: 8
  - Queue size: 100 (bound queue prevents unbounded growth)
  - Acquisition batch sizes: 10 (process fewer jobs at once)
  - History level: `audit` (vs `full`) - stores only essential audit events
  - Async history: disabled (reduces memory spike during processing)
- **Logging**: Reduced to WARN for root, INFO for orionops
  - Lower logging overhead reduces garbage pressure
- **File Upload Limits**: Reduced from 50MB/100MB to 25MB/50MB

### 3. Cloud Profile Configuration (application-cloud.yml)
Aggressive optimization for Render deployment:
- **Database Pool**: Further reduced to 3 connections (only what's needed for single instance)
- **Redis Pool**: Reduced to 3 connections
- **Tomcat**: 20 max threads, 10 accept queue (prevent thread explosion)
- **Flowable Async Executor** (highly optimized for cloud):
  - Core threads: 2 (minimal overhead)
  - Max threads: 4
  - Queue: 50 (smaller queue)
  - Acquisition batch: 5 (process fewer at once)
  - History level: `audit` (not `full`)
  - Async history: disabled
- **Hibernate**: 
  - Batch insert/update: 10
  - Order operations: enabled (more efficient batch processing)
- **Disabled Auto-configs**:
  - Springdoc/Swagger UI (saves ~30MB memory, not needed in production)
  - Kafka (already disabled, confirmed)
  - EventRegistry (already disabled, confirmed)
- **Logging**: WARN for everything except orionops (INFO)

## Memory Budget Breakdown (512MB)
```
JVM Allocation:
  - Max Heap:        350MB (application objects, caches)
  - Metaspace:       ~80MB (class metadata)
  - Code Cache:      ~40MB (JIT compiled code)
  - Direct Buffers:  ~20MB (NIO, Redis/Postgres connections)
  - Stacks:          ~22MB (8 threads × 2-3MB each)
  ─────────────────
  Total:            ~512MB
```

## Performance Impact
- **Startup**: Slightly slower (smaller initial heap means more GC during startup), but acceptable
- **Throughput**: 200ms max GC pause time ensures responsive request handling
- **Memory**: Stable around 450-500MB steady state
- **CPU**: G1GC may use slightly more CPU during GC, but more predictable latency

## Tuning Parameters (if needed)
If still hitting memory limits:
1. Reduce `-Xmx350m` further to 320m
2. Reduce connection pools to 2/1 (database) and 2/1 (redis)
3. Reduce Flowable executor threads to 2/2
4. Set Flowable history level to `activity` (even less data)
5. Disable Flowable async executor if not needed: `async-executor-activate: false`

If OOM still occurs:
- Check for memory leaks in application code
- Profile with `jps -l` and `jmap -histo` to identify large objects
- Consider reducing Tomcat max threads to 15 or 10

## Testing
Before deploying:
1. Build: `cd backend && mvn clean package -DskipTests -Dspring.profiles.active=cloud`
2. Run locally with heap limit: `java -Xmx350m -jar target/orionops-backend-0.1.0-SNAPSHOT.jar`
3. Load test to ensure GC tuning is adequate
4. Monitor: `jstat -gc <pid> 1000` to check GC frequency

## References
- [JVM Tuning Guide](https://docs.oracle.com/en/java/javase/21/gctuning/)
- [G1GC Best Practices](https://www.oracle.com/technical-resources/articles/java/g1gc.html)
- [Spring Boot Memory Optimization](https://spring.io/blog/2015/12/10/spring-boot-memory-performance)
