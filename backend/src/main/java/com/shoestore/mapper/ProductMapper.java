package com.shoestore.mapper;

import com.shoestore.dto.response.ProductResponse;
import com.shoestore.dto.response.ProductVariantResponse;
import com.shoestore.entity.Product;
import com.shoestore.entity.ProductVariant;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
public class ProductMapper {

    public ProductResponse toResponse(Product product) {
        if (product == null) return null;

        List<ProductVariantResponse> variantResponses = new ArrayList<>();
        BigDecimal minPrice = null;
        BigDecimal maxPrice = null;
        String defaultThumbnail = null;

        if (product.getVariants() != null && !product.getVariants().isEmpty()) {
            for (ProductVariant variant : product.getVariants()) {
                ProductVariantResponse varResp = toVariantResponse(variant);
                variantResponses.add(varResp);

                if (minPrice == null || variant.getPrice().compareTo(minPrice) < 0) {
                    minPrice = variant.getPrice();
                }
                if (maxPrice == null || variant.getPrice().compareTo(maxPrice) > 0) {
                    maxPrice = variant.getPrice();
                }
                if (defaultThumbnail == null && variant.getThumbnailUrl() != null) {
                    defaultThumbnail = variant.getThumbnailUrl();
                }
            }
        }

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .code(product.getCode())
                .slug(product.getSlug())
                .description(product.getDescription())
                .material(product.getMaterial())
                .gender(product.getGender())
                .brandName(product.getBrand() != null ? product.getBrand().getName() : null)
                .brandCode(product.getBrand() != null ? product.getBrand().getCode() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .categorySlug(product.getCategory() != null ? product.getCategory().getSlug() : null)
                .isFeatured(product.getIsFeatured())
                .minPrice(minPrice)
                .maxPrice(maxPrice)
                .defaultThumbnail(defaultThumbnail)
                .variants(variantResponses)
                .createdAt(product.getCreatedAt())
                .build();
    }

    public ProductVariantResponse toVariantResponse(ProductVariant variant) {
        if (variant == null) return null;

        return ProductVariantResponse.builder()
                .id(variant.getId())
                .sku(variant.getSku())
                .color(variant.getColor())
                .colorCode(variant.getColorCode())
                .sizeEu(variant.getSizeEu())
                .sizeUs(variant.getSizeUs())
                .price(variant.getPrice())
                .originalPrice(variant.getOriginalPrice())
                .stockQuantity(variant.getStockQuantity())
                .thumbnailUrl(variant.getThumbnailUrl())
                .images(variant.getImages() != null ? new ArrayList<>(variant.getImages()) : Collections.emptyList())
                .inStock(variant.getStockQuantity() != null && variant.getStockQuantity() > 0)
                .build();
    }
}
