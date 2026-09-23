package com.shoestore.controller;

import com.shoestore.dto.response.ApiResponse;
import com.shoestore.dto.response.BrandResponse;
import com.shoestore.repository.BrandRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/brands")
@RequiredArgsConstructor
@Tag(name = "Brand Catalog", description = "Các API lấy danh sách thương hiệu / hãng giày")
public class BrandController {

    private final BrandRepository brandRepository;

    @GetMapping
    @Transactional(readOnly = true)
    @Operation(summary = "Lấy danh sách tất cả thương hiệu giày từ CSDL")
    public ResponseEntity<ApiResponse<List<BrandResponse>>> getAllBrands() {
        List<BrandResponse> brands = brandRepository.findAll().stream()
                .filter(b -> Boolean.TRUE.equals(b.getIsActive()))
                .map(b -> BrandResponse.builder()
                        .id(b.getId())
                        .name(b.getName())
                        .code(b.getCode())
                        .logoUrl(b.getLogoUrl())
                        .description(b.getDescription())
                        .websiteUrl(b.getWebsiteUrl())
                        .isActive(b.getIsActive())
                        .productCount(b.getProducts() != null ? b.getProducts().size() : 0)
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(brands));
    }
}
