package com.shoestore.controller;

import com.shoestore.dto.request.CreateOrderRequest;
import com.shoestore.dto.response.ApiResponse;
import com.shoestore.entity.ProductVariant;
import com.shoestore.repository.ProductVariantRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@Tag(name = "Shopping Cart", description = "Các API thẩm định giỏ hàng, kiểm tra tồn kho và tính toán giá trị đơn")
public class CartController {

    private final ProductVariantRepository productVariantRepository;

    @PostMapping("/validate")
    @Operation(summary = "Thẩm định tồn kho và tính toán tạm tính đơn hàng theo thời gian thực")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validateCart(
            @RequestBody List<CreateOrderRequest.OrderItemRequest> items,
            @RequestParam(required = false) String couponCode
    ) {
        BigDecimal subtotal = BigDecimal.ZERO;
        List<Map<String, Object>> validatedItems = new ArrayList<>();
        boolean allInStock = true;

        for (CreateOrderRequest.OrderItemRequest req : items) {
            ProductVariant variant = productVariantRepository.findById(req.getVariantId()).orElse(null);
            if (variant != null) {
                boolean inStock = variant.getStockQuantity() >= req.getQuantity();
                if (!inStock) allInStock = false;

                BigDecimal lineTotal = variant.getPrice().multiply(BigDecimal.valueOf(req.getQuantity()));
                subtotal = subtotal.add(lineTotal);

                Map<String, Object> itemMap = new HashMap<>();
                itemMap.put("variantId", variant.getId());
                itemMap.put("productName", variant.getProduct().getName());
                itemMap.put("sku", variant.getSku());
                itemMap.put("sizeEu", variant.getSizeEu());
                itemMap.put("color", variant.getColor());
                itemMap.put("price", variant.getPrice());
                itemMap.put("quantity", req.getQuantity());
                itemMap.put("lineTotal", lineTotal);
                itemMap.put("inStock", inStock);
                itemMap.put("availableStock", variant.getStockQuantity());
                validatedItems.add(itemMap);
            }
        }

        BigDecimal freeShipThreshold = new BigDecimal("1000000");
        boolean isFreeShipping = subtotal.compareTo(freeShipThreshold) >= 0;
        BigDecimal shippingFee = isFreeShipping || subtotal.compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : new BigDecimal("30000");

        BigDecimal discountAmount = BigDecimal.ZERO;
        if (couponCode != null && !couponCode.isBlank()) {
            String code = couponCode.trim().toUpperCase();
            if ("KICKS200".equals(code) && subtotal.compareTo(new BigDecimal("1500000")) >= 0) {
                discountAmount = new BigDecimal("200000");
            } else if ("AIFIT".equals(code)) {
                discountAmount = new BigDecimal("150000");
            }
        }

        BigDecimal grandTotal = subtotal.subtract(discountAmount).add(shippingFee);
        if (grandTotal.compareTo(BigDecimal.ZERO) < 0) grandTotal = BigDecimal.ZERO;

        Map<String, Object> result = new HashMap<>();
        result.put("items", validatedItems);
        result.put("subtotal", subtotal);
        result.put("shippingFee", shippingFee);
        result.put("isFreeShipping", isFreeShipping);
        result.put("discountAmount", discountAmount);
        result.put("grandTotal", grandTotal);
        result.put("allInStock", allInStock);

        return ResponseEntity.ok(ApiResponse.success("Thẩm định giỏ hàng thành công!", result));
    }
}
