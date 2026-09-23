package com.shoestore.controller;

import com.shoestore.dto.request.ProductFilterRequest;
import com.shoestore.dto.response.ApiResponse;
import com.shoestore.dto.response.ProductResponse;
import com.shoestore.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Tag(name = "Product Catalog", description = "Các API danh mục, tìm kiếm và chi tiết giày thể thao")
public class ProductController {

    private final ProductService productService;

    @GetMapping
    @Operation(summary = "Lấy danh sách giày kèm bộ lọc (thương hiệu, danh mục, giá, phân trang)")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getProducts(@ModelAttribute ProductFilterRequest filter) {
        Page<ProductResponse> products = productService.getProducts(filter);
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết giày theo ID")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable Long id) {
        ProductResponse product = productService.getProductById(id);
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Xem chi tiết giày theo Slug thân thiện SEO")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductBySlug(@PathVariable String slug) {
        ProductResponse product = productService.getProductBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    @GetMapping("/featured")
    @Operation(summary = "Lấy danh sách các mẫu giày nổi bật (Featured Drops)")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getFeaturedProducts() {
        List<ProductResponse> featured = productService.getFeaturedProducts();
        return ResponseEntity.ok(ApiResponse.success(featured));
    }
}
