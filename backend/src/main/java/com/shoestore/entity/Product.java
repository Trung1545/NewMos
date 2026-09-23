package com.shoestore.entity;

import com.shoestore.entity.enums.Gender;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Thực thể Product đại diện cho bảng products (thông tin chung của mẫu giày:
 * tên, mã định danh, mô tả, chất liệu, giới tính, thương hiệu và danh mục).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "products", uniqueConstraints = {
        @UniqueConstraint(name = "uk_products_code", columnNames = "code"),
        @UniqueConstraint(name = "uk_products_slug", columnNames = "slug")
})
public class Product extends BaseEntity {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(max = 255, message = "Tên sản phẩm không vượt quá 255 ký tự")
    @Column(name = "name", length = 255, nullable = false)
    private String name;

    @NotBlank(message = "Mã sản phẩm không được để trống")
    @Size(max = 50, message = "Mã sản phẩm không vượt quá 50 ký tự")
    @Column(name = "code", length = 50, nullable = false, unique = true)
    private String code;

    @NotBlank(message = "Slug sản phẩm không được để trống")
    @Size(max = 280, message = "Slug không vượt quá 280 ký tự")
    @Column(name = "slug", length = 280, nullable = false, unique = true)
    private String slug;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Size(max = 255, message = "Mô tả chất liệu không vượt quá 255 ký tự")
    @Column(name = "material", length = 255)
    private String material;

    @NotNull(message = "Phân loại giới tính không được để trống")
    @Enumerated(EnumType.STRING)
    @Column(name = "gender", length = 20, nullable = false)
    private Gender gender;

    // Quan hệ ManyToOne với Brand
    @NotNull(message = "Thương hiệu không được để trống")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id", nullable = false, foreignKey = @ForeignKey(name = "fk_products_brand"))
    private Brand brand;

    // Quan hệ ManyToOne với Category
    @NotNull(message = "Danh mục không được để trống")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false, foreignKey = @ForeignKey(name = "fk_products_category"))
    private Category category;

    @Builder.Default
    @Column(name = "is_featured", nullable = false)
    private Boolean isFeatured = false;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // Quan hệ OneToMany với các biến thể (ProductVariant)
    @Builder.Default
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ProductVariant> variants = new ArrayList<>();

    // Helper methods
    public void addVariant(ProductVariant variant) {
        this.variants.add(variant);
        variant.setProduct(this);
    }

    public void removeVariant(ProductVariant variant) {
        this.variants.remove(variant);
        variant.setProduct(null);
    }
}
