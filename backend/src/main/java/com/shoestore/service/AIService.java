package com.shoestore.service;

import com.shoestore.dto.request.CalculateSizeRequest;
import com.shoestore.dto.request.SaveFitProfileRequest;
import com.shoestore.dto.response.AIFitProfileResponse;
import com.shoestore.dto.response.AISizeResponse;
import com.shoestore.dto.response.ProductResponse;
import com.shoestore.dto.response.ProductSizeRecommendationResponse;
import com.shoestore.entity.AIFitProfile;
import com.shoestore.enums.PreferredFit;

import java.util.List;

public interface AIService {

    /**
     * Tính toán kích thước giày tức thì không yêu cầu đăng nhập
     */
    AISizeResponse calculateSize(CalculateSizeRequest request);

    /**
     * Lưu hồ sơ đo chân bàn chân vào bảng ai_fit_profiles (Yêu cầu đăng nhập)
     */
    AIFitProfileResponse saveProfile(SaveFitProfileRequest request, Long userId);

    /**
     * Lấy thông tin số đo chân đã lưu của người dùng đang đăng nhập
     */
    AIFitProfileResponse getMyProfile(Long userId);

    /**
     * Tự động đối chiếu số đo của user với thông số đôi giày cụ thể để trả về size đề xuất
     */
    ProductSizeRecommendationResponse recommendProductSize(
            Long productId,
            Long userId,
            Double footLengthCm,
            Double footWidthCm,
            PreferredFit preferredFit
    );

    // Backward compatibility methods
    List<ProductResponse> visualSearch(String imageUrl, String queryText);

    List<AIFitProfile> getUserProfiles(Long userId);
}
