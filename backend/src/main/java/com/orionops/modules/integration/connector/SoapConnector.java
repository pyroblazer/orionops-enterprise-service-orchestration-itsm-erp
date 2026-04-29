package com.orionops.modules.integration.connector;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.ws.client.core.WebServiceTemplate;
import org.springframework.ws.soap.client.core.SoapActionCallback;

import jakarta.xml.bind.JAXBElement;
import javax.xml.namespace.QName;

/**
 * SOAP web service connector for legacy system integration.
 *
 * <p>Provides a simplified interface for making SOAP web service calls using
 * Spring's WebServiceTemplate. Supports JAXB marshalling/unmarshalling of
 * request/response objects, custom SOAP actions, and configurable endpoints.</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SoapConnector {

    private final WebServiceTemplate webServiceTemplate;

    /**
     * Sends a SOAP request and returns the unmarshalled response object.
     *
     * @param endpoint   the SOAP service endpoint URL
     * @param soapAction the SOAPAction header value
     * @param request    the JAXB-annotated request object
     * @return the unmarshalled response object, or null on failure
     */
    public Object sendRequest(String endpoint, String soapAction, Object request) {
        log.info("Sending SOAP request: endpoint={}, action={}", endpoint, soapAction);
        try {
            Object response = webServiceTemplate.marshalSendAndReceive(
                    endpoint,
                    request,
                    new SoapActionCallback(soapAction));

            log.info("SOAP response received: endpoint={}, action={}", endpoint, soapAction);
            return response;
        } catch (Exception e) {
            log.error("SOAP request failed: endpoint={}, action={}, error={}",
                    endpoint, soapAction, e.getMessage(), e);
            throw new RuntimeException("SOAP request failed: " + e.getMessage(), e);
        }
    }

    /**
     * Sends a SOAP request with raw XML body and returns the response as a string.
     * Useful for dynamic SOAP calls where JAXB classes are not available.
     *
     * @param endpoint   the SOAP service endpoint URL
     * @param soapAction the SOAPAction header value
     * @param xmlBody    the raw XML request body
     * @return the raw XML response body
     */
    public String sendRawRequest(String endpoint, String soapAction, String xmlBody) {
        log.info("Sending raw SOAP request: endpoint={}, action={}", endpoint, soapAction);
        try {
            String response = (String) webServiceTemplate.marshalSendAndReceive(
                    endpoint,
                    xmlBody,
                    new SoapActionCallback(soapAction));
            log.info("Raw SOAP response received from: {}", endpoint);
            return response;
        } catch (Exception e) {
            log.error("Raw SOAP request failed: endpoint={}, action={}, error={}",
                    endpoint, soapAction, e.getMessage(), e);
            throw new RuntimeException("SOAP request failed: " + e.getMessage(), e);
        }
    }

    /**
     * Sends a SOAP request wrapped in a JAXBElement for cases where
     * the root element name differs from the class name.
     *
     * @param endpoint      the SOAP service endpoint URL
     * @param soapAction    the SOAPAction header value
     * @param request       the JAXB-annotated request object
     * @param namespaceUri  the XML namespace URI
     * @param localPart     the root element local name
     * @return the unmarshalled response object
     */
    public Object sendRequestWithWrapper(String endpoint, String soapAction,
                                          Object request, String namespaceUri, String localPart) {
        log.info("Sending wrapped SOAP request: endpoint={}, action={}, element={}", endpoint, soapAction, localPart);
        try {
            JAXBElement<Object> jaxbRequest = new JAXBElement<>(
                    new QName(namespaceUri, localPart), Object.class, request);

            Object response = webServiceTemplate.marshalSendAndReceive(
                    endpoint,
                    jaxbRequest,
                    new SoapActionCallback(soapAction));

            log.info("Wrapped SOAP response received from: {}", endpoint);
            return response;
        } catch (Exception e) {
            log.error("Wrapped SOAP request failed: endpoint={}, error={}", endpoint, e.getMessage(), e);
            throw new RuntimeException("SOAP request failed: " + e.getMessage(), e);
        }
    }

    /**
     * Parses a SOAP response by unwrapping it from a JAXBElement if needed.
     *
     * @param response the raw response object from sendRequest
     * @param targetClass the expected response class
     * @return the typed response object
     */
    @SuppressWarnings("unchecked")
    public <T> T parseResponse(Object response, Class<T> targetClass) {
        if (response == null) {
            return null;
        }
        if (response instanceof JAXBElement<?> jaxbElement) {
            return (T) jaxbElement.getValue();
        }
        if (targetClass.isInstance(response)) {
            return targetClass.cast(response);
        }
        throw new IllegalArgumentException(
                "SOAP response type mismatch: expected " + targetClass.getName()
                        + " but got " + response.getClass().getName());
    }
}
