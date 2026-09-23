package com.shoestore.entity.enums;

public enum PaymentStatus {
    PENDING,    // Đang chờ thanh toán
    PAID,       // Đã thanh toán thành công (VietQR, Thẻ, MoMo...)
    FAILED,     // Giao dịch thanh toán thất bại
    REFUNDED    // Đã hoàn tiền cho khách hàng
}
