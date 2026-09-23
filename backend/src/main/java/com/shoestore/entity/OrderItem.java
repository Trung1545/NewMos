package com.shoestore.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

/**
 * Thực thể OrderItem đại diện cho bảng order_items (từng dòng sản phẩm cụ thể trong đơn hàng).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "order_items")
public class OrderItem extends BaseEntity {

    // Quan hệ ManyToOne với Order
    @NotNull(message = "Đơn hàng không được để trống")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, foreignKey = @ForeignKey(name = "fk_order_items_order"))
    private Order order;

    // Quan hệ ManyToOne với ProductVariant (lưu vết biến thể gốc)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", foreignKey = @ForeignKey(name = "fk_order_items_variant"))
    private ProductVariant productVariant;

    // Snapshot thông tin tại thời điểm mua (tránh bị ảnh hưởng nếu sản phẩm sau này đổi tên/giá)
    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(max = 255, message = "Tên sản phẩm không vượt quá 255 ký tự")
    @Column(name = "product_name", length = 255, nullable = false)
    private String productName;

    @NotBlank(message = "Mã SKU không được để trống")
    @Size(max = 100, message = "Mã SKU không vượt quá 100 ký tự")
    @Column(name = "sku", length = 100, nullable = false)
    private String sku;

    @Size(max = 100, message = "Màu sắc không vượt quá 100 ký tự")
    @Column(name = "color", length = 100)
    private String color;

    @NotBlank(message = "Size giày không được để trống")
    @Size(max = 20, message = "Size giày không vượt quá 20 ký tự")
    @Column(name = "size", length = 20, nullable = false)
    private String size;

    @NotNull(message = "Đơn giá không được để trống")
    @PositiveOrZero(message = "Đơn giá phải lớn hơn hoặc bằng 0")
    @Column(name = "unit_price", precision = 15, scale = 2, nullable = false)
    private BigDecimal unitPrice;

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng mua tối thiểu là 1")
    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @NotNull(message = "Thành tiền không được để trống")
    @PositiveOrZero(message = "Thành tiền phải lớn hơn hoặc bằng 0")
    @Column(name = "total_price", precision = 15, scale = 2, nullable = false)
    private BigDecimal totalPrice;

    @Column(name = "product_image", length = 500)
    private String productImage;

    public Long getProductVariantId() {
        return productVariant != null ? productVariant.getId() : null;
    }

    public BigDecimal getPrice() {
        return unitPrice;
    }

    public void setPrice(BigDecimal price) {
        this.unitPrice = price;
    }
}
