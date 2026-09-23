package com.shoestore.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardAnalyticsResponse {
    /**
     * Doanh thu thực tế (chỉ tính đơn hàng DELIVERED hoặc COMPLETED)
     */
    private BigDecimal totalRevenue;

    /**
     * Doanh thu đang treo / dự kiến (PENDING, CONFIRMED, SHIPPING, PROCESSING, PACKED)
     */
    private BigDecimal pendingRevenue;

    /**
     * Số lượng đơn đã giao thành công
     */
    private Long deliveredOrdersCount;

    /**
     * Số lượng đơn đang chờ duyệt / xử lý
     */
    private Long pendingOrdersCount;

    /**
     * Số lượng đơn đã bị hủy
     */
    private Long cancelledOrdersCount;

    /**
     * Tổng số lượng đơn hàng trên hệ thống
     */
    private Long totalOrdersCount;

    /**
     * Doanh thu thực tế hôm nay (theo updatedAt)
     */
    private BigDecimal todayRevenue;

    /**
     * Doanh thu thực tế tháng này (theo updatedAt)
     */
    private BigDecimal monthRevenue;
}
