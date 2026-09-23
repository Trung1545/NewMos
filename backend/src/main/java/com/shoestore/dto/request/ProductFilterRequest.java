package com.shoestore.dto.request;

import com.shoestore.entity.enums.Gender;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductFilterRequest {

    private String q;                   // Từ khóa tìm kiếm (tên, mã SP)
    private String brand;               // Tên hoặc mã thương hiệu (Nike, Jordan, etc.)
    private String category;            // Tên hoặc slug danh mục
    private Gender gender;              // Giới tính (MEN, WOMEN, UNISEX, KIDS)
    private BigDecimal minPrice;        // Giá tối thiểu
    private BigDecimal maxPrice;        // Giá tối đa
    private String size;                // Size EU (39, 40, 41, 42, etc.)
    private String color;               // Màu sắc
    private Boolean isFeatured;         // Sản phẩm nổi bật

    @Builder.Default
    private int page = 0;               // Số trang (0-indexed)

    @Builder.Default
    private int pageSize = 12;          // Số lượng sản phẩm mỗi trang

    @Builder.Default
    private String sortBy = "newest";   // newest, priceAsc, priceDesc, nameAsc
}
