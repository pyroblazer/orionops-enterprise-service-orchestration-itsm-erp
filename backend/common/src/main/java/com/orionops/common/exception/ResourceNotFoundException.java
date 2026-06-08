package com.orionops.common.exception;

/**
 * Thrown when a requested resource cannot be found in the system.
 * Used to signal 404 scenarios with descriptive messages.
 */
public class ResourceNotFoundException extends RuntimeException {

    private final String resourceType;
    private final String id;

    public ResourceNotFoundException(String resourceType, Object id) {
        super(String.format("%s not found with id: %s", resourceType, id));
        this.resourceType = resourceType;
        this.id = String.valueOf(id);
    }

    public ResourceNotFoundException(String message) {
        super(message);
        this.resourceType = "Unknown";
        this.id = "Unknown";
    }

    public String getResourceType() {
        return resourceType;
    }

    public String getId() {
        return id;
    }
}
