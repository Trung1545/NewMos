package com.shoestore.entity.enums;

public enum OrderStatus {
    PENDING,        // Đơn hàng vừa khởi tạo, chờ thanh toán hoặc xác nhận
    CONFIRMED,      // Đã duyệt đơn
    PROCESSING,     // Đang xử lý tại kho KICKS Lab
    PACKED,         // Đã kiểm định AI & đóng gói hộp chống sốc
    SHIPPING,       // Đang giao hàng cùng bưu tá
    SHIPPED,        // Đã xuất kho giao
    DELIVERED,      // Đã giao hàng và khách đã nhận
    COMPLETED,      // Hoàn thành
    CANCELLED,      // Đơn hàng đã hủy
    RETURNED        // Đã hoàn trả / đổi hàng thành công
}
