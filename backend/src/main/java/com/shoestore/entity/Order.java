package com.shoestore.entity;

import com.shoestore.enums.OrderStatus;
import com.shoestore.entity.enums.PaymentMethod;
import com.shoestore.entity.enums.PaymentStatus;
import com.shoestore.entity.enums.ShippingMethod;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Thực thể Order đại diện cho bảng orders (thông tin đặt hàng, trạng thái,
 * người nhận, địa chỉ giao nhận, thanh toán và lộ trình vận chuyển).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "orders", uniqueConstraints = {
        @UniqueConstraint(name = "uk_orders_order_code", columnNames = "order_code")
})
public class Order extends BaseEntity {

    @NotBlank(message = "Mã đơn hàng không được để trống")
    @Size(max = 50, message = "Mã đơn hàng không vượt quá 50 ký tự")
    @Column(name = "order_code", length = 50, nullable = false, unique = true)
    private String orderCode;

    // Quan hệ ManyToOne với User (có thể null đối với khách vãng lai mua nhanh)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", foreignKey = @ForeignKey(name = "fk_orders_user"))
    private User user;

    @NotBlank(message = "Tên người nhận không được để trống")
    @Size(max = 150, message = "Tên người nhận không vượt quá 150 ký tự")
    @Column(name = "recipient_name", length = 150, nullable = false)
    private String recipientName;

    @NotBlank(message = "Số điện thoại người nhận không được để trống")
    @Size(max = 20, message = "Số điện thoại không vượt quá 20 ký tự")
    @Column(name = "recipient_phone", length = 20, nullable = false)
    private String recipientPhone;

    @Size(max = 150, message = "Email không vượt quá 150 ký tự")
    @Column(name = "recipient_email", length = 150)
    private String recipientEmail;

    @NotBlank(message = "Địa chỉ giao hàng không được để trống")
    @Size(max = 500, message = "Địa chỉ không vượt quá 500 ký tự")
    @Column(name = "shipping_address", length = 500, nullable = false)
    private String shippingAddress;

    @Size(max = 100, message = "Tỉnh/Thành phố không vượt quá 100 ký tự")
    @Column(name = "province_city", length = 100)
    private String provinceCity;

    @Size(max = 500, message = "Ghi chú đơn hàng không vượt quá 500 ký tự")
    @Column(name = "order_notes", length = 500)
    private String orderNotes;

    @NotNull(message = "Phương thức vận chuyển không được để trống")
    @Enumerated(EnumType.STRING)
    @Column(name = "shipping_method", length = 30, nullable = false)
    private ShippingMethod shippingMethod;

    @NotNull(message = "Phương thức thanh toán không được để trống")
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 30, nullable = false)
    private PaymentMethod paymentMethod;

    @NotNull(message = "Trạng thái thanh toán không được để trống")
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", length = 30, nullable = false)
    private PaymentStatus paymentStatus;

    @NotNull(message = "Trạng thái đơn hàng không được để trống")
    @Enumerated(EnumType.STRING)
    @Column(name = "order_status", length = 30, nullable = false)
    private OrderStatus orderStatus;

    @NotNull(message = "Tạm tính không được để trống")
    @PositiveOrZero(message = "Tạm tính phải lớn hơn hoặc bằng 0")
    @Column(name = "subtotal", precision = 15, scale = 2, nullable = false)
    private BigDecimal subtotal;

    @Builder.Default
    @PositiveOrZero(message = "Phí vận chuyển phải lớn hơn hoặc bằng 0")
    @Column(name = "shipping_fee", precision = 15, scale = 2, nullable = false)
    private BigDecimal shippingFee = BigDecimal.ZERO;

    @Builder.Default
    @PositiveOrZero(message = "Giảm giá phải lớn hơn hoặc bằng 0")
    @Column(name = "discount_amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @NotNull(message = "Tổng tiền thanh toán không được để trống")
    @PositiveOrZero(message = "Tổng tiền phải lớn hơn hoặc bằng 0")
    @Column(name = "total_amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal totalAmount;

    @Size(max = 50, message = "Mã coupon không vượt quá 50 ký tự")
    @Column(name = "coupon_code", length = 50)
    private String couponCode;

    @Size(max = 100, message = "Mã vận đơn bưu tá không vượt quá 100 ký tự")
    @Column(name = "tracking_number", length = 100)
    private String trackingNumber;

    @Size(max = 100, message = "Tên đơn vị vận chuyển không vượt quá 100 ký tự")
    @Column(name = "courier_name", length = 100)
    private String courierName;

    @Size(max = 500, message = "Lý do hủy đơn không vượt quá 500 ký tự")
    @Column(name = "cancel_reason", length = 500)
    private String cancelReason;

    // Quan hệ OneToMany với chi tiết mặt hàng trong đơn
    @Builder.Default
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<OrderItem> orderItems = new ArrayList<>();

    // Helper methods
    public void addOrderItem(OrderItem item) {
        this.orderItems.add(item);
        item.setOrder(this);
    }

    public void removeOrderItem(OrderItem item) {
        this.orderItems.remove(item);
        item.setOrder(null);
    }

    // Alias methods for compatibility with different naming conventions
    public Long getUserId() {
        return user != null ? user.getId() : null;
    }

    public String getCustomerName() {
        return recipientName;
    }

    public void setCustomerName(String customerName) {
        this.recipientName = customerName;
    }

    public String getPhone() {
        return recipientPhone;
    }

    public void setPhone(String phone) {
        this.recipientPhone = phone;
    }

    public String getNote() {
        return orderNotes;
    }

    public void setNote(String note) {
        this.orderNotes = note;
    }

    public OrderStatus getStatus() {
        return orderStatus;
    }

    public void setStatus(OrderStatus status) {
        this.orderStatus = status;
    }
}
