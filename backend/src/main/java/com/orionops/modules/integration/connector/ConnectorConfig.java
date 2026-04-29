package com.orionops.modules.integration.connector;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.oxm.jaxb.Jaxb2Marshaller;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.ws.client.core.WebServiceTemplate;
import org.springframework.ws.transport.http.HttpComponentsMessageSender;

import java.time.Duration;

/**
 * Configuration for outbound REST and SOAP connectors.
 *
 * <p>Sets up WebClient with Resilience4j circuit breaker for REST calls,
 * and WebServiceTemplate for SOAP invocations. Both clients are configured
 * with connection pooling, timeouts, and authentication support.</p>
 */
@Configuration
public class ConnectorConfig {

    @Value("${orionops.connector.timeout.connect:10000}")
    private int connectTimeout;

    @Value("${orionops.connector.timeout.read:30000}")
    private int readTimeout;

    @Value("${orionops.connector.circuit-breaker.failure-rate-threshold:50}")
    private float failureRateThreshold;

    @Value("${orionops.connector.circuit-breaker.wait-duration-open-state:60000}")
    private long waitDurationInOpenState;

    @Value("${orionops.connector.circuit-breaker.permitted-calls-in-half-open-state:3}")
    private int permittedCallsInHalfOpenState;

    @Value("${orionops.connector.circuit-breaker.sliding-window-size:10}")
    private int slidingWindowSize;

    /**
     * WebClient builder for outbound REST API calls.
     */
    @Bean
    public WebClient connectorWebClient() {
        return WebClient.builder()
                .codecs(configurer -> configurer
                        .defaultCodecs()
                        .maxInMemorySize(10 * 1024 * 1024)) // 10MB
                .build();
    }

    /**
     * RestTemplate for synchronous REST calls (used by legacy integrations).
     */
    @Bean
    public RestTemplate connectorRestTemplate() {
        org.springframework.http.client.SimpleClientHttpRequestFactory factory =
                new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectTimeout);
        factory.setReadTimeout(readTimeout);
        return new RestTemplate(factory);
    }

    /**
     * JAX-B marshaller for SOAP message serialization.
     */
    @Bean
    public Jaxb2Marshaller soapMarshaller() {
        Jaxb2Marshaller marshaller = new Jaxb2Marshaller();
        marshaller.setPackagesToScan("com.orionops.modules.integration.connector.soap");
        marshaller.setMarshallingAnnotationsAware(true);
        return marshaller;
    }

    /**
     * WebServiceTemplate for outbound SOAP calls.
     */
    @Bean
    public WebServiceTemplate webServiceTemplate() {
        WebServiceTemplate template = new WebServiceTemplate();
        template.setMarshaller(soapMarshaller());
        template.setUnmarshaller(soapMarshaller());

        HttpComponentsMessageSender messageSender = new HttpComponentsMessageSender();
        messageSender.setConnectionTimeout(connectTimeout);
        messageSender.setReadTimeout(readTimeout);
        template.setMessageSender(messageSender);

        return template;
    }

    /**
     * Circuit breaker registry with default configuration for all connectors.
     */
    @Bean
    public CircuitBreakerRegistry circuitBreakerRegistry() {
        CircuitBreakerConfig config = CircuitBreakerConfig.custom()
                .failureRateThreshold(failureRateThreshold)
                .waitDurationInOpenState(Duration.ofMillis(waitDurationInOpenState))
                .permittedNumberOfCallsInHalfOpenState(permittedCallsInHalfOpenState)
                .slidingWindowType(CircuitBreakerConfig.SlidingWindowType.COUNT_BASED)
                .slidingWindowSize(slidingWindowSize)
                .minimumNumberOfCalls(slidingWindowSize / 2)
                .automaticTransitionFromOpenToHalfOpenEnabled(true)
                .build();

        CircuitBreakerRegistry registry = CircuitBreakerRegistry.ofDefaults();
        registry.addConfiguration("default", config);

        // Pre-register circuit breakers for known connectors
        registry.circuitBreaker("restConnector", config);
        registry.circuitBreaker("soapConnector", config);

        return registry;
    }
}
