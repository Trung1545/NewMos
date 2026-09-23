package com.shoestore.dto.response;

import com.shoestore.entity.enums.Gender;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {

    private Long id;
    private String name;
    private String code;
    private String slug;
    private String description;
    private String material;
    private Gender gender;
    private String brandName;
    private String brandCode;
    private String categoryName;
    private String categorySlug;
    private Boolean isFeatured;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private String defaultThumbnail;
    private List<ProductVariantResponse> variants;
    private LocalDateTime createdAt;
}
