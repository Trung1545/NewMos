package com.shoestore.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Thực thể ProductVariant đại diện cho bảng product_variants
 * (quản lý biến thể cụ thể theo từng mã SKU: màu sắc, size EU/US, tồn kho, giá bán và danh sách ảnh).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "product_variants", uniqueConstraints = {
        @UniqueConstraint(name = "uk_product_variants_sku", columnNames = "sku")
})
public class ProductVariant extends BaseEntity {

    // Quan hệ ManyToOne với Product gốc
    @com.fasterxml.jackson.annotation.JsonIgnore
    @NotNull(message = "Sản phẩm gốc không được để trống")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false, foreignKey = @ForeignKey(name = "fk_product_variants_product"))
    private Product product;

    @NotBlank(message = "Mã SKU không được để trống")
    @Size(max = 100, message = "Mã SKU không vượt quá 100 ký tự")
    @Column(name = "sku", length = 100, nullable = false, unique = true)
    private String sku;

    @NotBlank(message = "Tên phối màu không được để trống")
    @Size(max = 100, message = "Tên phối màu không vượt quá 100 ký tự")
    @Column(name = "color", length = 100, nullable = false)
    private String color;

    @Size(max = 20, message = "Mã màu Hex không vượt quá 20 ký tự")
    @Column(name = "color_code", length = 20)
    private String colorCode;

    @NotBlank(message = "Size EU không được để trống")
    @Size(max = 10, message = "Size EU không vượt quá 10 ký tự")
    @Column(name = "size_eu", length = 10, nullable = false)
    private String sizeEu;

    @Size(max = 10, message = "Size US không vượt quá 10 ký tự")
    @Column(name = "size_us", length = 10)
    private String sizeUs;

    @NotNull(message = "Giá bán không được để trống")
    @PositiveOrZero(message = "Giá bán phải lớn hơn hoặc bằng 0")
    @Column(name = "price", precision = 15, scale = 2, nullable = false)
    private BigDecimal price;

    @PositiveOrZero(message = "Giá gốc phải lớn hơn hoặc bằng 0")
    @Column(name = "original_price", precision = 15, scale = 2)
    private BigDecimal originalPrice;

    @NotNull(message = "Số lượng tồn kho không được để trống")
    @Min(value = 0, message = "Số lượng tồn kho không được nhỏ hơn 0")
    @Builder.Default
    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity = 0;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    // Danh sách ảnh chi tiết của biến thể (lưu trong bảng phụ product_variant_images)
    @Builder.Default
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "product_variant_images",
            joinColumns = @JoinColumn(name = "variant_id", foreignKey = @ForeignKey(name = "fk_variant_images_variant"))
    )
    @Column(name = "image_url", length = 500, nullable = false)
    private List<String> images = new ArrayList<>();

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @Builder.Default
    @OneToMany(mappedBy = "productVariant", fetch = FetchType.LAZY)
    private List<OrderItem> orderItems = new ArrayList<>();
}
