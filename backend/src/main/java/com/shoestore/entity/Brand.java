package com.shoestore.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Thực thể Brand đại diện cho thương hiệu giày (Nike, Jordan, Adidas, Puma, v.v.).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "brands", uniqueConstraints = {
        @UniqueConstraint(name = "uk_brands_name", columnNames = "name"),
        @UniqueConstraint(name = "uk_brands_code", columnNames = "code")
})
public class Brand extends BaseEntity {

    @NotBlank(message = "Tên thương hiệu không được để trống")
    @Size(max = 100, message = "Tên thương hiệu không vượt quá 100 ký tự")
    @Column(name = "name", length = 100, nullable = false, unique = true)
    private String name;

    @NotBlank(message = "Mã thương hiệu không được để trống")
    @Size(max = 50, message = "Mã thương hiệu không vượt quá 50 ký tự")
    @Column(name = "code", length = 50, nullable = false, unique = true)
    private String code;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "website_url", length = 255)
    private String websiteUrl;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @Builder.Default
    @OneToMany(mappedBy = "brand", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Product> products = new ArrayList<>();
}
