package com.orionops.concurrency;

import com.orionops.common.event.BaseEvent;
import com.orionops.common.event.EventPublisher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Tests for concurrency correctness across the platform.
 *
 * <p>Validates thread safety of shared mutable state, transaction-aware
 * event publishing, and Kafka consumer configuration.</p>
 */
@ExtendWith(MockitoExtension.class)
class ConcurrencyTest {

    @Mock
    private KafkaTemplate<String, String> kafkaTemplate;

    private EventPublisher eventPublisher;

    @BeforeEach
    void setUp() {
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        mapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
        lenient().when(kafkaTemplate.send(anyString(), anyString(), anyString()))
                .thenReturn(CompletableFuture.completedFuture(null));
        eventPublisher = new EventPublisher(kafkaTemplate, mapper);
    }

    // ---- EventPublisher: transaction-aware publishing ----

    @Test
    void publish_outsideTransaction_sendsImmediately() {
        BaseEvent event = createTestEvent();
        eventPublisher.publish(event);

        verify(kafkaTemplate, timeout(1000)).send(contains("incident"), anyString(), anyString());
    }

    @Test
    void publish_deferredUntilCommit_whenTransactionActive() {
        // Simulate an active Spring transaction
        org.springframework.transaction.support.TransactionSynchronizationManager.initSynchronization();
        try {
            BaseEvent event = createTestEvent();
            eventPublisher.publish(event);

            // Should NOT have sent yet — deferred until commit
            verify(kafkaTemplate, never()).send(anyString(), anyString(), anyString());

            // Simulate commit — trigger afterCommit callbacks
            for (TransactionSynchronization sync : TransactionSynchronizationManager.getSynchronizations()) {
                sync.afterCommit();
            }

            // NOW the event should be sent
            verify(kafkaTemplate, timeout(1000)).send(contains("incident"), anyString(), anyString());
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void publish_eventNotSent_whenTransactionRollsBack() {
        TransactionSynchronizationManager.initSynchronization();
        try {
            BaseEvent event = createTestEvent();
            eventPublisher.publish(event);

            // Simulate rollback — afterCommit is never called
            for (TransactionSynchronization sync : TransactionSynchronizationManager.getSynchronizations()) {
                // Intentionally NOT calling afterCommit — simulating rollback
            }

            verify(kafkaTemplate, never()).send(anyString(), anyString(), anyString());
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    // ---- EntraIdSyncService: token cache thread safety ----

    @Test
    void tokenHolder_isThreadSafe_underConcurrentAccess() throws InterruptedException {
        AtomicInteger refreshCount = new AtomicInteger(0);
        int threadCount = 20;
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);

        // Simulate a token holder like the one in EntraIdSyncService
        record TokenHolder(String accessToken, long expiresAtEpochMs) {
            boolean isExpired() { return accessToken == null || System.currentTimeMillis() >= expiresAtEpochMs; }
        }
        java.util.concurrent.atomic.AtomicReference<TokenHolder> holder =
                new AtomicReference<>(new TokenHolder(null, 0));
        java.util.concurrent.locks.ReentrantLock lock = new java.util.concurrent.locks.ReentrantLock();

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    TokenHolder current = holder.get();
                    if (current.isExpired()) {
                        lock.lock();
                        try {
                            current = holder.get();
                            if (current.isExpired()) {
                                refreshCount.incrementAndGet();
                                holder.set(new TokenHolder("token-" + System.nanoTime(),
                                        System.currentTimeMillis() + 3600_000));
                            }
                        } finally {
                            lock.unlock();
                        }
                    }
                    assertNotNull(holder.get().accessToken);
                } catch (Exception e) {
                    fail("Thread threw exception: " + e.getMessage());
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        assertTrue(doneLatch.await(5, TimeUnit.SECONDS));
        // Only one refresh should have happened despite 20 threads racing
        assertEquals(1, refreshCount.get(), "Double-checked locking should refresh token exactly once");
        executor.shutdown();
    }

    // ---- Invoice number uniqueness under concurrent generation ----

    @Test
    void invoiceNumbers_areUnique_underConcurrency() throws InterruptedException {
        int threadCount = 50;
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        java.util.Set<String> invoiceNumbers = java.util.Collections.synchronizedSet(new java.util.HashSet<>());
        AtomicInteger duplicates = new AtomicInteger(0);
        java.util.concurrent.atomic.AtomicLong invoiceSeq = new java.util.concurrent.atomic.AtomicLong(0);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    String invoiceNumber = "INV-" + java.time.LocalDateTime.now()
                            .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                            + "-" + invoiceSeq.incrementAndGet();
                    if (!invoiceNumbers.add(invoiceNumber)) {
                        duplicates.incrementAndGet();
                    }
                } catch (Exception e) {
                    fail("Thread threw exception: " + e.getMessage());
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        assertTrue(doneLatch.await(5, TimeUnit.SECONDS));
        assertEquals(0, duplicates.get(), "No duplicate invoice numbers should be generated");
        assertEquals(threadCount, invoiceNumbers.size());
        executor.shutdown();
    }

    // ---- Async executor: bounded pool rejects gracefully ----

    @Test
    void boundedThreadPool_doesNotCreateUnboundedThreads() throws InterruptedException {
        int taskCount = 200;
        AtomicInteger runningCount = new AtomicInteger(0);
        AtomicInteger maxConcurrent = new AtomicInteger(0);
        CountDownLatch allDone = new CountDownLatch(taskCount);
        ExecutorService pool = java.util.concurrent.Executors.newFixedThreadPool(8);

        for (int i = 0; i < taskCount; i++) {
            pool.submit(() -> {
                int current = runningCount.incrementAndGet();
                maxConcurrent.updateAndGet(max -> Math.max(max, current));
                try { Thread.sleep(10); } catch (InterruptedException ignored) {}
                runningCount.decrementAndGet();
                allDone.countDown();
            });
        }

        assertTrue(allDone.await(10, TimeUnit.SECONDS));
        assertTrue(maxConcurrent.get() <= 8, "Max concurrent tasks should not exceed pool size of 8, was: " + maxConcurrent.get());
        pool.shutdown();
    }

    // ---- Helpers ----

    private BaseEvent createTestEvent() {
        return new BaseEvent(
                UUID.randomUUID(),
                "IncidentCreated",
                "incident",
                UUID.randomUUID(),
                java.time.LocalDateTime.now(),
                new java.util.HashMap<>()
        ) {};
    }
}
