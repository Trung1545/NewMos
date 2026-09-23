package com.shoestore.controller;

import com.shoestore.dto.request.AdminCreateProductRequest;
import com.shoestore.dto.request.AdminUpdateProductRequest;
import com.shoestore.dto.request.AdminUpdateStockRequest;
import com.shoestore.dto.request.CancelOrderRequest;
import com.shoestore.dto.request.UpdateOrderStatusRequest;
import com.shoestore.dto.response.AdminInventoryResponse;
import com.shoestore.dto.response.ApiResponse;
import com.shoestore.dto.response.DashboardAnalyticsResponse;
import com.shoestore.dto.response.OrderResponse;
import com.shoestore.entity.Brand;
import com.shoestore.entity.Category;
import com.shoestore.entity.Product;
import com.shoestore.entity.ProductVariant;
import com.shoestore.entity.enums.Gender;
import com.shoestore.enums.OrderStatus;
import com.shoestore.exception.BadRequestException;
import com.shoestore.exception.ResourceNotFoundException;
import com.shoestore.repository.BrandRepository;
import com.shoestore.repository.CategoryRepository;
import com.shoestore.repository.ProductRepository;
import com.shoestore.repository.ProductVariantRepository;
import com.shoestore.dto.response.VariantStockUpdateDto;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import com.shoestore.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@Transactional
@RequiredArgsConstructor
@Tag(name = "Admin Management", description = "Các API quản trị hệ thống NewMos (Quản lý đơn hàng & tồn kho)")
public class AdminController {

    private final OrderService orderService;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final BrandRepository brandRepository;
    private final CategoryRepository categoryRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * GET /api/admin/analytics/dashboard: Thống kê doanh thu và các chỉ số theo chuẩn kế toán
     * Doanh thu chỉ được ghi nhận khi đơn hàng đã giao thành công (DELIVERED hoặc COMPLETED)
     */
    @GetMapping("/analytics/dashboard")
    @Operation(summary = "Lấy dữ liệu thống kê doanh thu và chỉ số đơn hàng theo chuẩn kế toán")
    public ResponseEntity<ApiResponse<DashboardAnalyticsResponse>> getDashboardAnalytics() {
        DashboardAnalyticsResponse analytics = orderService.getDashboardAnalytics();
        return ResponseEntity.ok(ApiResponse.success(analytics));
    }

    /**
     * GET /api/admin/orders: Lấy danh sách toàn bộ đơn hàng của hệ thống
     * Sắp xếp theo thời gian mới nhất, hỗ trợ lọc theo status nếu có.
     */
    @GetMapping("/orders")
    @Operation(summary = "Lấy danh sách tất cả đơn hàng (Hỗ trợ lọc theo trạng thái)")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getOrders(
            @RequestParam(required = false) OrderStatus status) {
        List<OrderResponse> orders = orderService.getAllOrders(status);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    /**
     * PUT /api/admin/orders/{id}/status: Cập nhật trạng thái đơn hàng
     * Nhận status: PENDING, CONFIRMED, SHIPPING, COMPLETED / DELIVERED, CANCELLED
     */
    @PutMapping("/orders/{id}/status")
    @Operation(summary = "Cập nhật trạng thái đơn hàng theo ID")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderStatusRequest request) {

        String rawStatus = request.getStatus() != null ? request.getStatus().trim().toUpperCase() : "";
        OrderStatus orderStatus;
        try {
            orderStatus = OrderStatus.valueOf(rawStatus);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Trạng thái đơn hàng không hợp lệ: " + rawStatus +
                    ". Các giá trị hợp lệ: PENDING, CONFIRMED, SHIPPING, DELIVERED, COMPLETED, CANCELLED");
        }

        OrderResponse updated = orderService.updateOrderStatus(id, orderStatus);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái đơn hàng thành công", updated));
    }

    /**
     * PUT /api/admin/orders/{id}/approve: Duyệt đơn hàng (chuyển sang CONFIRMED)
     */
    @PutMapping("/orders/{id}/approve")
    @Operation(summary = "Duyệt đơn hàng (chuyển trạng thái từ PENDING sang CONFIRMED)")
    public ResponseEntity<ApiResponse<OrderResponse>> approveOrder(@PathVariable Long id) {
        OrderResponse response = orderService.approveOrder(id);
        return ResponseEntity.ok(ApiResponse.success("Đã duyệt đơn hàng thành công", response));
    }

    /**
     * PUT /api/admin/orders/{id}/ship: Xác nhận giao hàng (chuyển sang SHIPPING)
     */
    @PutMapping("/orders/{id}/ship")
    @Operation(summary = "Xác nhận giao hàng (chuyển trạng thái sang SHIPPING)")
    public ResponseEntity<ApiResponse<OrderResponse>> shipOrder(@PathVariable Long id) {
        OrderResponse response = orderService.shipOrder(id);
        return ResponseEntity.ok(ApiResponse.success("Đã chuyển đơn hàng sang trạng thái đang giao", response));
    }

    /**
     * PUT /api/admin/orders/{id}/complete: Xác nhận giao thành công (chuyển sang DELIVERED)
     */
    @PutMapping("/orders/{id}/complete")
    @Operation(summary = "Xác nhận giao hàng thành công (chuyển trạng thái sang DELIVERED)")
    public ResponseEntity<ApiResponse<OrderResponse>> completeOrder(@PathVariable Long id) {
        OrderResponse response = orderService.completeOrder(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xác nhận đơn hàng giao thành công", response));
    }

    /**
     * PUT /api/admin/orders/{id}/cancel: Hủy đơn hàng kèm lý do, tự động hoàn lại số lượng tồn kho (restock)
     */
    @PutMapping("/orders/{id}/cancel")
    @Operation(summary = "Hủy đơn hàng kèm lý do và tự động hoàn lại tồn kho vào product_variants")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            @PathVariable Long id,
            @RequestBody(required = false) CancelOrderRequest request) {
        String reason = request != null ? request.getReason() : null;
        OrderResponse response = orderService.cancelOrder(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Đã hủy đơn hàng và hoàn lại số lượng tồn kho thành công", response));
    }

    /**
     * GET /api/admin/inventory: Lấy danh sách toàn bộ sản phẩm và các biến thể size
     * Kèm thông tin tồn kho stock_quantity và đánh dấu sắp hết hàng (<= 3).
     */
    /**
     * GET /api/admin/inventory: Lấy danh sách toàn bộ sản phẩm và các biến thể size
     * Kèm thông tin tồn kho stock_quantity và đánh dấu sắp hết hàng (<= 3).
     */
    /**
     * GET /api/admin/inventory: Lấy danh sách toàn bộ sản phẩm và các biến thể size
     * Kèm thông tin tồn kho stock_quantity và đánh dấu sắp hết hàng (<= 3).
     */
    @GetMapping("/inventory")
    @Operation(summary = "Lấy danh sách kiểm soát tồn kho toàn bộ sản phẩm và biến thể size")
    public ResponseEntity<ApiResponse<List<AdminInventoryResponse>>> getInventory() {
        List<Product> products = productRepository.findAllWithVariantsAndDetails();
        List<AdminInventoryResponse> inventoryList = new ArrayList<>();
        for (Product product : products) {
            inventoryList.add(mapToInventoryResponse(product));
        }
        return ResponseEntity.ok(ApiResponse.success(inventoryList));
    }

    /**
     * PUT /api/admin/variants/{variantId}/stock: Cập nhật trực tiếp số lượng tồn kho biến thể
     */
    @PutMapping("/variants/{variantId}/stock")
    @Operation(summary = "Cập nhật nhanh số lượng tồn kho của biến thể")
    public ResponseEntity<ApiResponse<AdminInventoryResponse.VariantInventoryDto>> updateVariantStock(
            @PathVariable Long variantId,
            @Valid @RequestBody AdminUpdateStockRequest request) {

        ProductVariant variant = productVariantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biến thể với ID: " + variantId));

        if (request.getStockQuantity() < 0) {
            throw new BadRequestException("Số lượng tồn kho không được nhỏ hơn 0");
        }

        variant.setStockQuantity(request.getStockQuantity());
        ProductVariant updated = productVariantRepository.save(variant);

        boolean isLowStock = updated.getStockQuantity() <= 3;
        AdminInventoryResponse.VariantInventoryDto dto = AdminInventoryResponse.VariantInventoryDto.builder()
                .id(updated.getId())
                .sku(updated.getSku())
                .color(updated.getColor())
                .colorCode(updated.getColorCode())
                .sizeEu(updated.getSizeEu())
                .sizeUs(updated.getSizeUs())
                .price(updated.getPrice())
                .originalPrice(updated.getOriginalPrice())
                .stockQuantity(updated.getStockQuantity())
                .isLowStock(isLowStock)
                .thumbnailUrl(updated.getThumbnailUrl())
                .isActive(updated.getIsActive())
                .build();

        if (updated.getProduct() != null && messagingTemplate != null) {
            int remaining = updated.getStockQuantity() != null ? updated.getStockQuantity() : 0;
            VariantStockUpdateDto updateDto = VariantStockUpdateDto.builder()
                    .productId(updated.getProduct().getId())
                    .variantId(updated.getId())
                    .size(updated.getSizeEu() != null ? updated.getSizeEu() : updated.getSizeUs())
                    .remainingStock(remaining)
                    .isOutOfStock(remaining <= 0)
                    .build();
            messagingTemplate.convertAndSend("/topic/products/" + updated.getProduct().getId() + "/stock", updateDto);
        }

        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật số lượng tồn kho thành công", dto));
    }

    /**
     * PUT /api/admin/products/{productId}: Cập nhật thông tin chi tiết sản phẩm
     */
    @PutMapping("/products/{productId}")
    @Operation(summary = "Cập nhật thông tin sản phẩm (tên, giá, mô tả, danh mục, hãng, ảnh)")
    public ResponseEntity<ApiResponse<AdminInventoryResponse>> updateProduct(
            @PathVariable Long productId,
            @Valid @RequestBody AdminUpdateProductRequest request) {

        Product product = productRepository.findByIdWithDetails(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + productId));

        product.setName(request.getName().trim());
        if (request.getDescription() != null) {
            product.setDescription(request.getDescription().trim());
        }
        if (request.getMaterial() != null) {
            product.setMaterial(request.getMaterial().trim());
        }
        if (request.getIsActive() != null) {
            product.setIsActive(request.getIsActive());
        }

        // Cập nhật danh mục
        if (request.getCategoryId() != null) {
            categoryRepository.findById(request.getCategoryId()).ifPresent(product::setCategory);
        } else if (request.getCategorySlug() != null && !request.getCategorySlug().isBlank()) {
            categoryRepository.findBySlug(request.getCategorySlug().trim()).ifPresent(product::setCategory);
        }

        // Cập nhật thương hiệu
        if (request.getBrandName() != null && !request.getBrandName().isBlank()) {
            brandRepository.findByNameIgnoreCase(request.getBrandName().trim()).ifPresent(product::setBrand);
        }

        // Cập nhật giá niêm yết, link ảnh và màu sắc cho các biến thể
        if (product.getVariants() != null) {
            for (ProductVariant v : product.getVariants()) {
                if (request.getPrice() != null) {
                    v.setPrice(request.getPrice());
                }
                if (request.getImageUrl() != null && !request.getImageUrl().isBlank()) {
                    v.setThumbnailUrl(request.getImageUrl().trim());
                    if (v.getImages() == null || v.getImages().isEmpty()) {
                        v.setImages(new ArrayList<>(List.of(request.getImageUrl().trim())));
                    } else {
                        v.getImages().set(0, request.getImageUrl().trim());
                    }
                }
                if (request.getColor() != null && !request.getColor().isBlank()) {
                    v.setColor(request.getColor().trim());
                }
            }
        }

        Product saved = productRepository.save(product);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin sản phẩm thành công", mapToInventoryResponse(saved)));
    }

    /**
     * POST /api/admin/products: Thêm sản phẩm mới kèm các biến thể size ban đầu (size 36 - 40)
     */
    @PostMapping("/products")
    @Operation(summary = "Thêm sản phẩm mới kèm các biến thể size ban đầu (36 - 40)")
    public ResponseEntity<ApiResponse<AdminInventoryResponse>> createProduct(
            @Valid @RequestBody AdminCreateProductRequest request) {

        String name = request.getName().trim();

        // Tạo slug nếu chưa có
        String slug = request.getSlug() != null && !request.getSlug().isBlank()
                ? slugify(request.getSlug())
                : slugify(name);

        if (productRepository.existsBySlug(slug)) {
            slug = slug + "-" + (System.currentTimeMillis() % 10000);
        }

        // Tạo mã code nếu chưa có
        String code = request.getCode() != null && !request.getCode().isBlank()
                ? request.getCode().trim().toUpperCase()
                : "NM-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        if (productRepository.existsByCode(code)) {
            code = code + "-" + (System.currentTimeMillis() % 1000);
        }

        // Thương hiệu: Mặc định NewMos
        Brand brand = brandRepository.findByCodeIgnoreCase("NEWMOS")
                .orElseGet(() -> brandRepository.findAll().stream().findFirst()
                        .orElseGet(() -> brandRepository.save(Brand.builder()
                                .name("NewMos")
                                .code("NEWMOS")
                                .description("Thương hiệu giày NewMos chính hãng")
                                .isActive(true)
                                .build())));

        // Danh mục
        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId()).orElse(null);
        } else if (request.getCategorySlug() != null && !request.getCategorySlug().isBlank()) {
            category = categoryRepository.findBySlug(request.getCategorySlug().trim()).orElse(null);
        }
        if (category == null) {
            category = categoryRepository.findAll().stream().findFirst()
                    .orElseGet(() -> categoryRepository.save(Category.builder()
                            .name("Giày Thể Thao Đa Năng")
                            .slug("the-thao-da-nang")
                            .description("Thiết kế tối ưu lực đẩy bàn chân")
                            .isActive(true)
                            .build()));
        }

        Product product = Product.builder()
                .name(name)
                .code(code)
                .slug(slug)
                .description(request.getDescription())
                .material(request.getMaterial() != null ? request.getMaterial() : "Vải dệt Flyknit thoáng khí & Đệm bọt EVA")
                .gender(Gender.UNISEX)
                .brand(brand)
                .category(category)
                .isFeatured(true)
                .isActive(true)
                .variants(new ArrayList<>())
                .build();

        // 5 Size chuẩn 36 -> 40
        List<String> defaultSizes = List.of("36", "37", "38", "39", "40");
        Map<String, String> sizeUsMap = Map.of(
                "36", "5.0",
                "37", "5.5",
                "38", "6.0",
                "39", "6.5",
                "40", "7.5"
        );

        Map<String, Integer> stockMap = new HashMap<>();
        if (request.getSizeStocks() != null) {
            for (AdminCreateProductRequest.SizeStockItem item : request.getSizeStocks()) {
                if (item.getSize() != null) {
                    stockMap.put(item.getSize().trim(), item.getStockQuantity() != null ? item.getStockQuantity() : 0);
                }
            }
        }

        String color = request.getColor() != null && !request.getColor().isBlank() ? request.getColor().trim() : "Bản Tiêu Chuẩn";
        String colorCode = request.getColorCode() != null && !request.getColorCode().isBlank() ? request.getColorCode().trim() : "#DC2626";
        String imageUrl = request.getImageUrl() != null && !request.getImageUrl().isBlank()
                ? request.getImageUrl().trim()
                : "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80";

        for (String sz : defaultSizes) {
            int stock = stockMap.getOrDefault(sz, 10);
            String sku = code + "-" + sz;
            if (productVariantRepository.existsBySku(sku)) {
                sku = sku + "-" + (System.currentTimeMillis() % 1000);
            }

            ProductVariant variant = ProductVariant.builder()
                    .product(product)
                    .sku(sku)
                    .color(color)
                    .colorCode(colorCode)
                    .sizeEu(sz)
                    .sizeUs(sizeUsMap.getOrDefault(sz, "6.0"))
                    .price(request.getPrice())
                    .originalPrice(request.getOriginalPrice() != null ? request.getOriginalPrice() : request.getPrice())
                    .stockQuantity(stock)
                    .thumbnailUrl(imageUrl)
                    .images(new ArrayList<>(List.of(imageUrl)))
                    .isActive(true)
                    .build();
            product.addVariant(variant);
        }

        Product saved = productRepository.save(product);
        return ResponseEntity.ok(ApiResponse.success("Thêm sản phẩm mới và tạo các biến thể size thành công", mapToInventoryResponse(saved)));
    }

    /**
     * DELETE /api/admin/products/{productId}: Xóa hoặc chuyển trạng thái isActive = false để ẩn khỏi /shop
     */
    @DeleteMapping("/products/{productId}")
    @Operation(summary = "Xóa hoặc chuyển trạng thái ẩn/kích hoạt sản phẩm")
    public ResponseEntity<ApiResponse<Boolean>> toggleProductStatus(
            @PathVariable Long productId,
            @RequestParam(required = false, defaultValue = "false") boolean permanent) {

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + productId));

        if (permanent) {
            try {
                productRepository.delete(product);
                return ResponseEntity.ok(ApiResponse.success("Đã xóa vĩnh viễn sản phẩm thành công", true));
            } catch (Exception e) {
                // Nếu sản phẩm đã phát sinh liên kết trong order_items, fallback sang ẩn sản phẩm
                product.setIsActive(false);
                productRepository.save(product);
                return ResponseEntity.ok(ApiResponse.success("Sản phẩm đã có lịch sử đơn hàng, đã chuyển sang trạng thái Ẩn", false));
            }
        } else {
            // Chuyển đổi trạng thái isActive (Soft delete / Hide)
            boolean newStatus = !Boolean.TRUE.equals(product.getIsActive());
            product.setIsActive(newStatus);
            if (product.getVariants() != null) {
                for (ProductVariant v : product.getVariants()) {
                    v.setIsActive(newStatus);
                }
            }
            productRepository.save(product);
            String msg = newStatus ? "Đã kích hoạt lại sản phẩm hiển thị trên Shop" : "Đã ẩn sản phẩm khỏi trang Shop thành công";
            return ResponseEntity.ok(ApiResponse.success(msg, newStatus));
        }
    }

    /**
     * Helper chuyển đổi Product thành AdminInventoryResponse chuẩn DTO
     */
    private AdminInventoryResponse mapToInventoryResponse(Product product) {
        List<AdminInventoryResponse.VariantInventoryDto> variantDtos = new ArrayList<>();
        int totalStock = 0;
        int lowStockCount = 0;

        String defaultThumbnail = null;
        BigDecimal representativePrice = BigDecimal.ZERO;
        BigDecimal representativeOriginalPrice = BigDecimal.ZERO;
        String defaultColor = "Tiêu chuẩn";
        String defaultColorCode = "#DC2626";

        if (product.getVariants() != null && !product.getVariants().isEmpty()) {
            ProductVariant first = product.getVariants().get(0);
            if (first.getPrice() != null) representativePrice = first.getPrice();
            if (first.getOriginalPrice() != null) representativeOriginalPrice = first.getOriginalPrice();
            if (first.getColor() != null && !first.getColor().isBlank()) defaultColor = first.getColor();
            if (first.getColorCode() != null && !first.getColorCode().isBlank()) defaultColorCode = first.getColorCode();

            for (ProductVariant v : product.getVariants()) {
                if (v.getThumbnailUrl() != null && !v.getThumbnailUrl().isBlank()) {
                    defaultThumbnail = v.getThumbnailUrl();
                    break;
                }
            }
        }

        if (product.getVariants() != null) {
            for (ProductVariant variant : product.getVariants()) {
                int stock = variant.getStockQuantity() != null ? variant.getStockQuantity() : 0;
                boolean isLowStock = stock <= 3;

                totalStock += stock;
                if (isLowStock) {
                    lowStockCount++;
                }

                variantDtos.add(AdminInventoryResponse.VariantInventoryDto.builder()
                        .id(variant.getId())
                        .sku(variant.getSku())
                        .color(variant.getColor())
                        .colorCode(variant.getColorCode())
                        .sizeEu(variant.getSizeEu())
                        .sizeUs(variant.getSizeUs())
                        .price(variant.getPrice())
                        .originalPrice(variant.getOriginalPrice())
                        .stockQuantity(stock)
                        .isLowStock(isLowStock)
                        .thumbnailUrl(variant.getThumbnailUrl() != null ? variant.getThumbnailUrl() : defaultThumbnail)
                        .isActive(variant.getIsActive())
                        .build());
            }
        }

        return AdminInventoryResponse.builder()
                .productId(product.getId())
                .productCode(product.getCode())
                .productName(product.getName())
                .brandName(product.getBrand() != null ? product.getBrand().getName() : "NewMos")
                .brandId(product.getBrand() != null ? product.getBrand().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : "Sneaker")
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .defaultThumbnail(defaultThumbnail)
                .price(representativePrice)
                .originalPrice(representativeOriginalPrice)
                .description(product.getDescription())
                .color(defaultColor)
                .colorCode(defaultColorCode)
                .isActive(product.getIsActive())
                .totalStock(totalStock)
                .lowStockCount(lowStockCount)
                .variants(variantDtos)
                .build();
    }

    /**
     * Helper tạo slug tiếng Việt thân thiện
     */
    private String slugify(String input) {
        if (input == null) return "";
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        String pattern = "\\p{InCombiningDiacriticalMarks}+";
        String slug = normalized.replaceAll(pattern, "")
                .toLowerCase()
                .replaceAll("đ", "d")
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
        return slug.isBlank() ? "newmos-shoe" : slug;
    }
}
