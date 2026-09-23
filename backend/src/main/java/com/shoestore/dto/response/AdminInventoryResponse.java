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
public class AdminInventoryResponse {

    private Long productId;
    private String productCode;
    private String productName;
    private String brandName;
    private Long brandId;
    private String categoryName;
    private Long categoryId;
    private String defaultThumbnail;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private String description;
    private String color;
    private String colorCode;
    private Boolean isActive;
    private Integer totalStock;
    private Integer lowStockCount;
    private List<VariantInventoryDto> variants;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VariantInventoryDto {
        private Long id;
        private String sku;
        private String color;
        private String colorCode;
        private String sizeEu;
        private String sizeUs;
        private BigDecimal price;
        private BigDecimal originalPrice;
        private Integer stockQuantity;
        private Boolean isLowStock;
        private String thumbnailUrl;
        private Boolean isActive;
    }
}
