package com.shoestore.dto.response;

import com.shoestore.entity.enums.PaymentMethod;
import com.shoestore.entity.enums.PaymentStatus;
import com.shoestore.entity.enums.ShippingMethod;
import com.shoestore.enums.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {

    private Long id;
    private String orderCode;
    private Long userId;
    private String recipientName;
    private String recipientPhone;
    private String recipientEmail;
    private String shippingAddress;
    private String provinceCity;
    private String orderNotes;
    private ShippingMethod shippingMethod;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private OrderStatus orderStatus;
    private BigDecimal subtotal;
    private BigDecimal shippingFee;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private String couponCode;
    private String trackingNumber;
    private String courierName;
    private List<OrderItemResponse> items;
    private String cancelReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public String getCustomerName() {
        return recipientName;
    }

    public String getPhone() {
        return recipientPhone;
    }

    public String getNote() {
        return orderNotes;
    }

    public OrderStatus getStatus() {
        return orderStatus;
    }
}
