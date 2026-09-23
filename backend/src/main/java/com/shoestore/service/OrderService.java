package com.shoestore.service;

import com.shoestore.dto.request.CreateOrderRequest;
import com.shoestore.dto.response.OrderResponse;
import com.shoestore.enums.OrderStatus;
import org.springframework.data.domain.Page;

import java.util.List;

public interface OrderService {

    OrderResponse createOrder(CreateOrderRequest request);

    OrderResponse createOrder(CreateOrderRequest request, Long userId);

    OrderResponse getOrderByCode(String orderCode);

    List<OrderResponse> getMyOrders(Long userId);

    OrderResponse trackOrder(String orderCode, String phone);

    Page<OrderResponse> getUserOrders(Long userId, int page, int size);

    OrderResponse updateOrderStatus(Long orderId, OrderStatus status);

    List<OrderResponse> getAllOrders(OrderStatus status);

    OrderResponse approveOrder(Long orderId);

    OrderResponse shipOrder(Long orderId);

    OrderResponse completeOrder(Long orderId);

    OrderResponse cancelOrder(Long orderId, String reason);

    com.shoestore.dto.response.DashboardAnalyticsResponse getDashboardAnalytics();
}
