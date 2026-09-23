package com.shoestore.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Thực thể Category đại diện cho danh mục sản phẩm (Chạy bộ, Bóng rổ, Lifestyle, v.v.),
 * hỗ trợ phân cấp cha-con (Hierarchical Categories).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "categories", uniqueConstraints = {
        @UniqueConstraint(name = "uk_categories_slug", columnNames = "slug")
})
public class Category extends BaseEntity {

    @NotBlank(message = "Tên danh mục không được để trống")
    @Size(max = 100, message = "Tên danh mục không vượt quá 100 ký tự")
    @Column(name = "name", length = 100, nullable = false)
    private String name;

    @NotBlank(message = "Đường dẫn định danh (slug) không được để trống")
    @Size(max = 120, message = "Slug không vượt quá 120 ký tự")
    @Column(name = "slug", length = 120, nullable = false, unique = true)
    private String slug;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    // Phân cấp danh mục cha (Parent Category)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id", foreignKey = @ForeignKey(name = "fk_categories_parent"))
    private Category parent;

    // Danh sách danh mục con
    @com.fasterxml.jackson.annotation.JsonIgnore
    @Builder.Default
    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Category> subCategories = new ArrayList<>();

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // Quan hệ OneToMany với Sản phẩm
    @com.fasterxml.jackson.annotation.JsonIgnore
    @Builder.Default
    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Product> products = new ArrayList<>();
}
