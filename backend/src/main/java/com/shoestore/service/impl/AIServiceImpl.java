package com.shoestore.service.impl;

import com.shoestore.dto.request.CalculateSizeRequest;
import com.shoestore.dto.request.SaveFitProfileRequest;
import com.shoestore.dto.response.AIFitProfileResponse;
import com.shoestore.dto.response.AISizeResponse;
import com.shoestore.dto.response.ProductResponse;
import com.shoestore.dto.response.ProductSizeRecommendationResponse;
import com.shoestore.entity.AIFitProfile;
import com.shoestore.entity.Product;
import com.shoestore.entity.ProductVariant;
import com.shoestore.entity.User;
import com.shoestore.enums.ArchType;
import com.shoestore.enums.FootShape;
import com.shoestore.enums.FootType;
import com.shoestore.enums.PreferredFit;
import com.shoestore.exception.ResourceNotFoundException;
import com.shoestore.mapper.AIFitProfileMapper;
import com.shoestore.mapper.ProductMapper;
import com.shoestore.repository.AIFitProfileRepository;
import com.shoestore.repository.ProductRepository;
import com.shoestore.repository.UserRepository;
import com.shoestore.service.AIService;
import com.shoestore.util.SizingCalculatorUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AIServiceImpl implements AIService {

    private final AIFitProfileRepository aiFitProfileRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductMapper productMapper;
    private final AIFitProfileMapper aiFitProfileMapper;

    @Override
    public AISizeResponse calculateSize(CalculateSizeRequest request) {
        String brand = request.getResolvedBrand();
        FootShape footShape = request.getFootShape() != null
                ? request.getFootShape()
                : SizingCalculatorUtil.detectFootShapeFromDimensions(request.getFootLengthCm(), request.getFootWidthCm());

        ArchType archType = request.getArchType() != null ? request.getArchType() : ArchType.NORMAL;
        PreferredFit preferredFit = request.getPreferredFit() != null ? request.getPreferredFit() : PreferredFit.PERFECT;

        SizingCalculatorUtil.SizeRecommendationResult result = SizingCalculatorUtil.calculateSize(
                request.getFootLengthCm(),
                request.getFootWidthCm(),
                footShape,
                archType,
                preferredFit,
                brand
        );

        return AISizeResponse.builder()
                .recommendedSizeEu(result.getRecommendedSizeEu())
                .recommendedSizeUs(result.getRecommendedSizeUs())
                .confidenceScore(result.getConfidenceScore())
                .fittingAdvice(result.getFittingAdvice())
                .fitAssessment(result.getFitAssessment())
                .footShape(result.getDetectedFootShape())
                .archType(result.getDetectedArchType())
                .preferredFit(result.getDetectedPreferredFit())
                .footLengthCm(request.getFootLengthCm())
                .footWidthCm(request.getFootWidthCm())
                .brand(brand)
                .build();
    }

    @Override
    @Transactional
    public AIFitProfileResponse saveProfile(SaveFitProfileRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId));

        FootShape footShape = request.getFootShape() != null
                ? request.getFootShape()
                : SizingCalculatorUtil.detectFootShapeFromDimensions(request.getFootLengthCm(), request.getFootWidthCm());

        ArchType archType = request.getArchType() != null ? request.getArchType() : ArchType.NORMAL;
        PreferredFit preferredFit = request.getPreferredFit() != null ? request.getPreferredFit() : PreferredFit.PERFECT;

        SizingCalculatorUtil.SizeRecommendationResult result = SizingCalculatorUtil.calculateSize(
                request.getFootLengthCm(),
                request.getFootWidthCm(),
                footShape,
                archType,
                preferredFit,
                request.getBrand()
        );

        // Tìm hồ sơ mặc định hiện có của người dùng nếu có để cập nhật
        Optional<AIFitProfile> existingProfileOpt = aiFitProfileRepository.findByUserIdAndIsDefaultTrue(userId);
        AIFitProfile profile = existingProfileOpt.orElseGet(() -> AIFitProfile.builder().user(user).build());

        String profileName = request.getProfileName() != null && !request.getProfileName().isBlank()
                ? request.getProfileName()
                : "Hồ sơ đo chân AI - EU " + result.getRecommendedSizeEu();

        profile.setUser(user);
        profile.setProfileName(profileName);
        profile.setFootLengthCm(request.getFootLengthCm());
        profile.setFootWidthCm(request.getFootWidthCm());
        profile.setArchType(archType);
        profile.setFootShape(footShape);
        profile.setPreferredFit(preferredFit);
        profile.setRecommendedSizeEu(result.getRecommendedSizeEu());
        profile.setRecommendedSizeUs(result.getRecommendedSizeUs());
        profile.setScanConfidenceScore(result.getConfidenceScore());
        profile.setFittingAdvice(result.getFittingAdvice());
        profile.setNotes(result.getFitAssessment());
        profile.setIsDefault(true);

        if (request.getScanImageUrl() != null && !request.getScanImageUrl().isBlank()) {
            profile.setScanImageUrl(request.getScanImageUrl());
        }

        AIFitProfile saved = aiFitProfileRepository.save(profile);
        log.info("Đã lưu hồ sơ AI Fit thành công cho user ID: {}, Profile ID: {}", userId, saved.getId());

        return aiFitProfileMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public AIFitProfileResponse getMyProfile(Long userId) {
        if (userId == null) {
            return null;
        }

        Optional<AIFitProfile> profileOpt = aiFitProfileRepository.findByUserIdAndIsDefaultTrue(userId);
        if (profileOpt.isEmpty()) {
            List<AIFitProfile> list = aiFitProfileRepository.findByUserIdOrderByCreatedAtDesc(userId);
            if (!list.isEmpty()) {
                profileOpt = Optional.of(list.get(0));
            }
        }

        return profileOpt.map(aiFitProfileMapper::toResponse).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductSizeRecommendationResponse recommendProductSize(
            Long productId,
            Long userId,
            Double footLengthCm,
            Double footWidthCm,
            PreferredFit preferredFit
    ) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + productId));

        String brandName = product.getBrand() != null ? product.getBrand().getName() : "General";

        // 1. Xác định số đo sinh trắc học
        double length = footLengthCm != null ? footLengthCm : 26.5;
        double width = footWidthCm != null ? footWidthCm : 10.0;
        FootShape shape = FootShape.STANDARD;
        ArchType arch = ArchType.NORMAL;
        PreferredFit fit = preferredFit != null ? preferredFit : PreferredFit.PERFECT;

        // Nếu người dùng đã đăng nhập và có hồ sơ, ưu tiên dùng hồ sơ thực
        if (userId != null) {
            AIFitProfileResponse myProfile = getMyProfile(userId);
            if (myProfile != null) {
                length = myProfile.getFootLengthCm();
                width = myProfile.getFootWidthCm();
                if (myProfile.getFootShape() != null) shape = myProfile.getFootShape();
                if (myProfile.getArchType() != null) arch = myProfile.getArchType();
                if (myProfile.getPreferredFit() != null) fit = myProfile.getPreferredFit();
            }
        }

        // 2. Tính toán ma trận size theo hãng của sản phẩm
        SizingCalculatorUtil.SizeRecommendationResult calc = SizingCalculatorUtil.calculateSize(
                length,
                width,
                shape,
                arch,
                fit,
                brandName
        );

        String recommendedEu = calc.getRecommendedSizeEu();

        // 3. Đối chiếu với các biến thể size thực tế còn hàng của sản phẩm
        List<ProductVariant> variants = product.getVariants() != null ? product.getVariants() : new ArrayList<>();
        List<String> inStockSizes = variants.stream()
                .filter(v -> Boolean.TRUE.equals(v.getIsActive()) && v.getStockQuantity() != null && v.getStockQuantity() > 0)
                .map(ProductVariant::getSizeEu)
                .distinct()
                .collect(Collectors.toList());

        boolean isAvailableInStock = false;
        Long matchedVariantId = null;

        for (ProductVariant v : variants) {
            if (Boolean.TRUE.equals(v.getIsActive()) && v.getStockQuantity() != null && v.getStockQuantity() > 0) {
                if (v.getSizeEu().equalsIgnoreCase(recommendedEu) || v.getSizeEu().equalsIgnoreCase(calc.getRecommendedSizeUs())) {
                    isAvailableInStock = true;
                    matchedVariantId = v.getId();
                    break;
                }
            }
        }

        return ProductSizeRecommendationResponse.builder()
                .productId(product.getId())
                .productName(product.getName())
                .brandName(brandName)
                .recommendedSizeEu(recommendedEu)
                .recommendedSizeUs(calc.getRecommendedSizeUs())
                .confidenceScore(calc.getConfidenceScore())
                .fittingAdvice(calc.getFittingAdvice())
                .fitAssessment(calc.getFitAssessment())
                .isAvailableInStock(isAvailableInStock)
                .matchedVariantId(matchedVariantId)
                .userFootLengthCm(length)
                .userFootWidthCm(width)
                .availableSizesInStock(inStockSizes)
                .build();
    }

    // ==================== Backward Compatibility Methods ====================

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> visualSearch(String imageUrl, String queryText) {
        String keyword = queryText != null && !queryText.isBlank() ? queryText : "AIR";
        Page<Product> page = productRepository.filterProducts(keyword, null, null, null, null, PageRequest.of(0, 6));

        return page.getContent().stream()
                .map(productMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AIFitProfile> getUserProfiles(Long userId) {
        return aiFitProfileRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
}
