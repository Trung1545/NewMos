package com.shoestore.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.shoestore.entity.enums.PaymentMethod;
import com.shoestore.entity.enums.ShippingMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {

    @JsonAlias({"customerName", "recipientName"})
    @NotBlank(message = "Tên người nhận không được để trống")
    @Size(max = 150, message = "Tên người nhận không vượt quá 150 ký tự")
    private String recipientName;

    @JsonAlias({"phone", "recipientPhone"})
    @NotBlank(message = "Số điện thoại nhận hàng không được để trống")
    @Size(max = 20, message = "Số điện thoại không vượt quá 20 ký tự")
    private String recipientPhone;

    private String recipientEmail;

    @NotBlank(message = "Địa chỉ giao hàng không được để trống")
    @Size(max = 500, message = "Địa chỉ giao hàng không vượt quá 500 ký tự")
    private String shippingAddress;

    private String provinceCity;

    @JsonAlias({"note", "orderNotes"})
    private String orderNotes;

    @Builder.Default
    private ShippingMethod shippingMethod = ShippingMethod.STANDARD;

    @Builder.Default
    private PaymentMethod paymentMethod = PaymentMethod.COD;

    private String couponCode;

    @NotEmpty(message = "Đơn hàng phải chứa ít nhất 1 sản phẩm")
    @Valid
    private List<OrderItemRequest> items;

    // Alias methods
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

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemRequest {

        @JsonAlias({"productVariantId", "variantId"})
        @NotNull(message = "Mã biến thể sản phẩm (variantId) không được để trống")
        private Long variantId;

        @NotNull(message = "Số lượng không được để trống")
        private Integer quantity;

        public Long getProductVariantId() {
            return variantId;
        }

        public void setProductVariantId(Long productVariantId) {
            this.variantId = productVariantId;
        }
    }
}
