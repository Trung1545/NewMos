package com.shoestore.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariantResponse {

    private Long id;
    private String sku;
    private String color;
    private String colorCode;
    private String sizeEu;
    private String sizeUs;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private Integer stockQuantity;
    private String thumbnailUrl;
    private List<String> images;
    private Boolean inStock;
}
