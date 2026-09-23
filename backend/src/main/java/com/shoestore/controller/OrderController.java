package com.shoestore.controller;

import com.shoestore.dto.request.CreateOrderRequest;
import com.shoestore.dto.response.ApiResponse;
import com.shoestore.dto.response.OrderResponse;
import com.shoestore.enums.OrderStatus;
import com.shoestore.security.service.UserDetailsImpl;
import com.shoestore.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Orders & Checkout", description = "Các API đặt hàng, thanh toán và tra cứu tiến trình vận chuyển")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @Operation(summary = "Tạo đơn hàng mới (Mở công khai cho khách vãng lai và người đã đăng nhập)")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        Long userId = userDetails != null ? userDetails.getId() : null;
        OrderResponse order = orderService.createOrder(request, userId);
        return ResponseEntity.ok(ApiResponse.success("Đặt hàng thành công!", order));
    }

    @GetMapping("/track/{orderCode}")
    @Operation(summary = "Tra cứu đơn hàng theo mã đơn (NM-XXXXXX)")
    public ResponseEntity<ApiResponse<OrderResponse>> trackOrderByPath(@PathVariable String orderCode) {
        OrderResponse order = orderService.getOrderByCode(orderCode);
        return ResponseEntity.ok(ApiResponse.success("Tìm thấy thông tin đơn hàng!", order));
    }

    @GetMapping("/code/{orderCode}")
    @Operation(summary = "Lấy chi tiết đơn hàng theo mã đơn (Hỗ trợ tra cứu)")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderByCode(@PathVariable String orderCode) {
        OrderResponse order = orderService.getOrderByCode(orderCode);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin đơn hàng thành công!", order));
    }

    @GetMapping("/track")
    @Operation(summary = "Tra cứu nhanh tiến trình đơn hàng theo mã đơn và số điện thoại")
    public ResponseEntity<ApiResponse<OrderResponse>> trackOrder(
            @RequestParam String orderCode,
            @RequestParam(required = false) String phone
    ) {
        OrderResponse order = orderService.trackOrder(orderCode, phone);
        return ResponseEntity.ok(ApiResponse.success("Tìm thấy thông tin đơn hàng!", order));
    }

    @GetMapping("/my-orders")
    @Operation(summary = "Lấy danh sách lịch sử đơn hàng của tài khoản đang đăng nhập (yêu cầu JWT)")
    public ResponseEntity<ApiResponse<?>> getMyOrders(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập để xem đơn hàng"));
        }

        if (page != null) {
            Page<OrderResponse> orders = orderService.getUserOrders(userDetails.getId(), page, size != null ? size : 10);
            return ResponseEntity.ok(ApiResponse.success(orders));
        } else {
            List<OrderResponse> orders = orderService.getMyOrders(userDetails.getId());
            return ResponseEntity.ok(ApiResponse.success(orders));
        }
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    @Operation(summary = "Cập nhật trạng thái đơn hàng (Dành cho Quản trị viên / Nhân viên)")
    public ResponseEntity<ApiResponse<OrderResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam OrderStatus status
    ) {
        OrderResponse order = orderService.updateOrderStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái đơn hàng thành công!", order));
    }
}
