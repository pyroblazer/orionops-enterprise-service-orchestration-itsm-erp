package com.orionops.modules.cmdb.dto;

import com.orionops.modules.cmdb.entity.Service;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private String description;
    private Service.ServiceStatus status;
    private String owner;
    private String supportGroup;
    private String category;
}
