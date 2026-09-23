package com.shoestore.controller;

import com.shoestore.dto.request.CalculateSizeRequest;
import com.shoestore.dto.request.SaveFitProfileRequest;
import com.shoestore.dto.response.AIFitProfileResponse;
import com.shoestore.dto.response.AISizeResponse;
import com.shoestore.dto.response.ApiResponse;
import com.shoestore.dto.response.ProductResponse;
import com.shoestore.dto.response.ProductSizeRecommendationResponse;
import com.shoestore.entity.AIFitProfile;
import com.shoestore.enums.PreferredFit;
import com.shoestore.security.service.UserDetailsImpl;
import com.shoestore.service.AIService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Tag(name = "AI Fit Studio", description = "Các API đo size chân thông minh và gợi ý kích thước chuẩn xác")
public class AIController {

    private final AIService aiService;

    @PostMapping("/calculate-size")
    @Operation(summary = "Tính toán size giày tức thì từ số đo cm và form chân (Không cần đăng nhập)")
    public ResponseEntity<ApiResponse<AISizeResponse>> calculateSize(
            @Valid @RequestBody CalculateSizeRequest request
    ) {
        AISizeResponse response = aiService.calculateSize(request);
        return ResponseEntity.ok(ApiResponse.success("Tính toán kích thước giày thành công!", response));
    }

    @PostMapping("/save-profile")
    @Operation(summary = "Lưu hồ sơ số đo chân vào tài khoản người dùng (Yêu cầu đăng nhập)")
    public ResponseEntity<ApiResponse<AIFitProfileResponse>> saveProfile(
            @Valid @RequestBody SaveFitProfileRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập để lưu hồ sơ số đo chân"));
        }

        AIFitProfileResponse response = aiService.saveProfile(request, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Lưu hồ sơ số đo chân thành công!", response));
    }

    @GetMapping("/my-profile")
    @Operation(summary = "Lấy thông tin số đo chân đã lưu của người dùng hiện tại (Yêu cầu đăng nhập)")
    public ResponseEntity<ApiResponse<AIFitProfileResponse>> getMyProfile(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập để xem hồ sơ đo chân"));
        }

        AIFitProfileResponse response = aiService.getMyProfile(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin hồ sơ đo chân thành công!", response));
    }

    @GetMapping("/recommend-product-size/{productId}")
    @Operation(summary = "Tự động đối chiếu số đo người dùng với sản phẩm cụ thể để đề xuất size chuẩn xác")
    public ResponseEntity<ApiResponse<ProductSizeRecommendationResponse>> recommendProductSize(
            @PathVariable Long productId,
            @RequestParam(required = false) Double footLengthCm,
            @RequestParam(required = false) Double footWidthCm,
            @RequestParam(required = false) PreferredFit preferredFit,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        Long userId = userDetails != null ? userDetails.getId() : null;
        ProductSizeRecommendationResponse response = aiService.recommendProductSize(
                productId,
                userId,
                footLengthCm,
                footWidthCm,
                preferredFit
        );
        return ResponseEntity.ok(ApiResponse.success("Gợi ý kích thước sản phẩm thành công!", response));
    }

    // ==================== Backward Compatibility Endpoints ====================

    @PostMapping("/visual-search")
    @Operation(summary = "Tìm kiếm sản phẩm giày bằng hình ảnh AI (Visual Search)")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> visualSearch(
            @RequestParam(required = false) String imageUrl,
            @RequestParam(required = false) String queryText
    ) {
        List<ProductResponse> products = aiService.visualSearch(imageUrl, queryText);
        return ResponseEntity.ok(ApiResponse.success("Tìm thấy sản phẩm tương đồng!", products));
    }

    @GetMapping("/profiles")
    @Operation(summary = "Lấy danh sách hồ sơ đo chân (Legacy endpoint)")
    public ResponseEntity<ApiResponse<List<AIFitProfile>>> getUserProfiles(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập để xem hồ sơ đo chân"));
        }

        List<AIFitProfile> profiles = aiService.getUserProfiles(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(profiles));
    }
}
