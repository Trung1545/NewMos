package com.shoestore.service.impl;

import com.shoestore.dto.response.DashboardAnalyticsResponse;
import com.shoestore.dto.request.CreateOrderRequest;
import com.shoestore.dto.response.OrderItemResponse;
import com.shoestore.dto.response.OrderResponse;
import com.shoestore.entity.Order;
import com.shoestore.entity.OrderItem;
import com.shoestore.entity.ProductVariant;
import com.shoestore.entity.User;
import com.shoestore.entity.enums.PaymentMethod;
import com.shoestore.entity.enums.PaymentStatus;
import com.shoestore.entity.enums.ShippingMethod;
import com.shoestore.enums.OrderStatus;
import com.shoestore.exception.BadRequestException;
import com.shoestore.exception.ResourceNotFoundException;
import com.shoestore.repository.OrderRepository;
import com.shoestore.repository.ProductVariantRepository;
import com.shoestore.repository.UserRepository;
import com.shoestore.security.service.UserDetailsImpl;
import com.shoestore.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.shoestore.dto.response.VariantStockUpdateDto;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final ProductVariantRepository productVariantRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private static final SecureRandom RANDOM = new SecureRandom();

    @Override
    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        Long userId = null;
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl userDetails) {
            userId = userDetails.getId();
        }
        return createOrder(request, userId);
    }

    @Override
    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request, Long userId) {
        User user = null;
        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        // 1. Kiểm tra tồn kho và tạo OrderItem (sử dụng SELECT ... FOR UPDATE chống Race Condition / Overselling)
        for (CreateOrderRequest.OrderItemRequest itemReq : request.getItems()) {
            ProductVariant variant = productVariantRepository.findByIdForUpdate(itemReq.getVariantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Biến thể giày", "id", itemReq.getVariantId()));

            if (variant.getStockQuantity() < itemReq.getQuantity()) {
                throw new BadRequestException(String.format("Sản phẩm '%s' (Size %s) chỉ còn %d đôi trong kho!",
                        variant.getProduct().getName(), variant.getSizeEu(), variant.getStockQuantity()));
            }

            // Trừ trực tiếp số lượng tồn kho trong product_variants
            variant.setStockQuantity(variant.getStockQuantity() - itemReq.getQuantity());
            ProductVariant savedVariant = productVariantRepository.save(variant);
            broadcastStockUpdate(savedVariant);

            BigDecimal unitPrice = variant.getPrice() != null ? variant.getPrice() : BigDecimal.ZERO;
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            subtotal = subtotal.add(lineTotal);

            OrderItem orderItem = OrderItem.builder()
                    .productVariant(variant)
                    .productName(variant.getProduct().getName())
                    .sku(variant.getSku())
                    .color(variant.getColor())
                    .size(variant.getSizeEu())
                    .unitPrice(unitPrice)
                    .quantity(itemReq.getQuantity())
                    .totalPrice(lineTotal)
                    .productImage(variant.getThumbnailUrl())
                    .build();

            orderItems.add(orderItem);
        }

        // 2. Tính phí vận chuyển (Miễn phí từ 1.000.000 ₫)
        ShippingMethod shippingMethod = request.getShippingMethod() != null
                ? request.getShippingMethod()
                : ShippingMethod.STANDARD;

        BigDecimal freeShipThreshold = new BigDecimal("1000000");
        BigDecimal shippingFee = BigDecimal.ZERO;
        if (subtotal.compareTo(freeShipThreshold) < 0) {
            shippingFee = shippingMethod == ShippingMethod.EXPRESS
                    ? new BigDecimal("50000")
                    : new BigDecimal("30000");
        }

        // 3. Tính giảm giá voucher
        BigDecimal discountAmount = BigDecimal.ZERO;
        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            String code = request.getCouponCode().trim().toUpperCase();
            if (("NEWMOS200".equals(code) || "KICKS200".equals(code)) && subtotal.compareTo(new BigDecimal("1500000")) >= 0) {
                discountAmount = new BigDecimal("200000");
            } else if ("AIFIT".equals(code)) {
                discountAmount = new BigDecimal("150000");
            }
        }

        BigDecimal totalAmount = subtotal.subtract(discountAmount).add(shippingFee);
        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) {
            totalAmount = BigDecimal.ZERO;
        }

        // 4. Khởi tạo mã đơn hàng ngẫu nhiên dạng NM-XXXXXX
        String orderCode = "NM-" + (100000 + RANDOM.nextInt(900000));
        while (orderRepository.existsByOrderCode(orderCode)) {
            orderCode = "NM-" + (100000 + RANDOM.nextInt(900000));
        }

        PaymentMethod paymentMethod = request.getPaymentMethod() != null
                ? request.getPaymentMethod()
                : PaymentMethod.COD;

        Order order = Order.builder()
                .orderCode(orderCode)
                .user(user)
                .recipientName(request.getRecipientName())
                .recipientPhone(request.getRecipientPhone())
                .recipientEmail(request.getRecipientEmail())
                .shippingAddress(request.getShippingAddress())
                .provinceCity(request.getProvinceCity())
                .orderNotes(request.getOrderNotes())
                .shippingMethod(shippingMethod)
                .paymentMethod(paymentMethod)
                .paymentStatus(PaymentStatus.PENDING)
                .orderStatus(OrderStatus.PENDING)
                .subtotal(subtotal)
                .shippingFee(shippingFee)
                .discountAmount(discountAmount)
                .totalAmount(totalAmount)
                .couponCode(request.getCouponCode())
                .trackingNumber("NMPOST-" + (10000000 + RANDOM.nextInt(90000000)) + "X")
                .courierName("SPX Express Vietnam")
                .build();

        for (OrderItem item : orderItems) {
            order.addOrderItem(item);
        }

        Order savedOrder = orderRepository.save(order);
        return mapToResponse(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderByCode(String orderCode) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "orderCode", orderCode));

        return mapToResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders(Long userId) {
        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return orders.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse trackOrder(String orderCode, String phone) {
        Order order = orderRepository.trackGuestOrder(orderCode, phone)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "orderCode/phone", orderCode));

        return mapToResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getUserOrders(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
        Page<Order> orderPage = orderRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);

        return orderPage.map(this::mapToResponse);
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));

        if (status == OrderStatus.CANCELLED && order.getOrderStatus() != OrderStatus.CANCELLED) {
            restockOrderVariants(order);
        }

        order.setOrderStatus(status);
        if (status == OrderStatus.DELIVERED || status == OrderStatus.COMPLETED) {
            order.setPaymentStatus(PaymentStatus.PAID);
            order.setUpdatedAt(LocalDateTime.now());
        }

        Order updated = orderRepository.save(order);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public OrderResponse approveOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));

        if (order.getOrderStatus() != OrderStatus.PENDING) {
            throw new BadRequestException("Chỉ có thể duyệt đơn hàng đang ở trạng thái Chờ duyệt (PENDING)!");
        }

        order.setOrderStatus(OrderStatus.CONFIRMED);
        Order updated = orderRepository.save(order);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public OrderResponse shipOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));

        order.setOrderStatus(OrderStatus.SHIPPING);
        Order updated = orderRepository.save(order);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public OrderResponse completeOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));

        order.setOrderStatus(OrderStatus.DELIVERED);
        order.setPaymentStatus(PaymentStatus.PAID);
        order.setUpdatedAt(LocalDateTime.now());
        Order updated = orderRepository.save(order);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public OrderResponse cancelOrder(Long orderId, String reason) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));

        if (order.getOrderStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Đơn hàng này đã được hủy trước đó!");
        }

        // Tự động hoàn lại số lượng tồn kho (restock) vào product_variants
        restockOrderVariants(order);

        order.setOrderStatus(OrderStatus.CANCELLED);
        order.setCancelReason(reason != null && !reason.isBlank() ? reason.trim() : "Quản trị viên hủy đơn hàng");
        Order updated = orderRepository.save(order);
        return mapToResponse(updated);
    }

    private void restockOrderVariants(Order order) {
        if (order.getOrderItems() != null) {
            for (OrderItem item : order.getOrderItems()) {
                if (item.getProductVariant() != null) {
                    ProductVariant variant = item.getProductVariant();
                    int currentStock = variant.getStockQuantity() != null ? variant.getStockQuantity() : 0;
                    int restockQty = item.getQuantity() != null ? item.getQuantity() : 1;
                    variant.setStockQuantity(currentStock + restockQty);
                    ProductVariant savedVariant = productVariantRepository.save(variant);
                    broadcastStockUpdate(savedVariant);
                }
            }
        }
    }

    private void broadcastStockUpdate(ProductVariant variant) {
        if (variant != null && variant.getProduct() != null && messagingTemplate != null) {
            int remaining = variant.getStockQuantity() != null ? variant.getStockQuantity() : 0;
            VariantStockUpdateDto updateDto = VariantStockUpdateDto.builder()
                    .productId(variant.getProduct().getId())
                    .variantId(variant.getId())
                    .size(variant.getSizeEu() != null ? variant.getSizeEu() : variant.getSizeUs())
                    .remainingStock(remaining)
                    .isOutOfStock(remaining <= 0)
                    .build();

            String destination = "/topic/products/" + variant.getProduct().getId() + "/stock";
            messagingTemplate.convertAndSend(destination, updateDto);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders(OrderStatus status) {
        List<Order> orders;
        if (status != null) {
            orders = orderRepository.findByOrderStatusOrderByCreatedAtDesc(status);
        } else {
            orders = orderRepository.findAllByOrderByCreatedAtDesc();
        }
        return orders.stream().map(this::mapToResponse).toList();
    }

    private OrderResponse mapToResponse(Order order) {
        List<OrderItemResponse> itemResponses = new ArrayList<>();
        if (order.getOrderItems() != null) {
            for (OrderItem item : order.getOrderItems()) {
                itemResponses.add(OrderItemResponse.builder()
                        .id(item.getId())
                        .variantId(item.getProductVariant() != null ? item.getProductVariant().getId() : null)
                        .productName(item.getProductName())
                        .sku(item.getSku())
                        .color(item.getColor())
                        .size(item.getSize())
                        .unitPrice(item.getUnitPrice())
                        .quantity(item.getQuantity())
                        .totalPrice(item.getTotalPrice())
                        .productImage(item.getProductImage())
                        .build());
            }
        }

        return OrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .userId(order.getUser() != null ? order.getUser().getId() : null)
                .recipientName(order.getRecipientName())
                .recipientPhone(order.getRecipientPhone())
                .recipientEmail(order.getRecipientEmail())
                .shippingAddress(order.getShippingAddress())
                .provinceCity(order.getProvinceCity())
                .orderNotes(order.getOrderNotes())
                .cancelReason(order.getCancelReason())
                .shippingMethod(order.getShippingMethod())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .orderStatus(order.getOrderStatus())
                .subtotal(order.getSubtotal())
                .shippingFee(order.getShippingFee())
                .discountAmount(order.getDiscountAmount())
                .totalAmount(order.getTotalAmount())
                .couponCode(order.getCouponCode())
                .trackingNumber(order.getTrackingNumber())
                .courierName(order.getCourierName())
                .items(itemResponses)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardAnalyticsResponse getDashboardAnalytics() {
        BigDecimal totalRevenue = orderRepository.calculateTotalRealRevenue();
        BigDecimal pendingRevenue = orderRepository.calculateTotalPendingRevenue();

        long deliveredCount = orderRepository.countDeliveredOrders();
        long pendingCount = orderRepository.countByOrderStatus(OrderStatus.PENDING);
        long cancelledCount = orderRepository.countByOrderStatus(OrderStatus.CANCELLED);
        long totalOrders = orderRepository.count();

        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        BigDecimal todayRevenue = orderRepository.calculateRevenueFrom(startOfToday);

        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        BigDecimal monthRevenue = orderRepository.calculateRevenueFrom(startOfMonth);

        return DashboardAnalyticsResponse.builder()
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .pendingRevenue(pendingRevenue != null ? pendingRevenue : BigDecimal.ZERO)
                .deliveredOrdersCount(deliveredCount)
                .pendingOrdersCount(pendingCount)
                .cancelledOrdersCount(cancelledCount)
                .totalOrdersCount(totalOrders)
                .todayRevenue(todayRevenue != null ? todayRevenue : BigDecimal.ZERO)
                .monthRevenue(monthRevenue != null ? monthRevenue : BigDecimal.ZERO)
                .build();
    }
}
