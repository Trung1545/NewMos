package com.shoestore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUpdateProductRequest {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    private String name;

    @PositiveOrZero(message = "Giá niêm yết phải lớn hơn hoặc bằng 0")
    private BigDecimal price;

    private String description;

    private String material;

    private String categorySlug;

    private Long categoryId;

    private String brandName;

    private String imageUrl;

    private String color;

    private Boolean isActive;
}
