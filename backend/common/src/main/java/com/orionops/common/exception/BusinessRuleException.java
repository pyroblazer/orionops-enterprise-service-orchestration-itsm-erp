package com.orionops.common.exception;

/**
 * Thrown when a business rule or domain invariant is violated.
 * Used for validation failures that are not simple input validation errors
 * but rather domain-level constraints (e.g., state transitions, workflow rules).
 */
public class BusinessRuleException extends RuntimeException {

    public BusinessRuleException(String message) {
        super(message);
    }

    public BusinessRuleException(String message, Throwable cause) {
        super(message, cause);
    }
}
