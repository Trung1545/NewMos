package com.shoestore.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BrandResponse {
    private Long id;
    private String name;
    private String code;
    private String logoUrl;
    private String description;
    private String websiteUrl;
    private Boolean isActive;
    private Integer productCount;
}
