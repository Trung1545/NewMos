package com.shoestore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
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
public class AdminCreateProductRequest {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    private String name;

    private String code;

    private String slug;

    @NotNull(message = "Giá niêm yết không được để trống")
    @PositiveOrZero(message = "Giá niêm yết phải lớn hơn hoặc bằng 0")
    private BigDecimal price;

    private BigDecimal originalPrice;

    private String description;

    private String material;

    private String color;

    private String colorCode;

    private String categorySlug;

    private Long categoryId;

    private String imageUrl;

    private List<SizeStockItem> sizeStocks;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SizeStockItem {
        private String size; // "36", "37", "38", "39", "40"
        private Integer stockQuantity;
    }
}
