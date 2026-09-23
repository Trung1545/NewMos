package com.shoestore.controller;

import com.shoestore.dto.response.ApiResponse;
import com.shoestore.dto.response.CategoryResponse;
import com.shoestore.repository.CategoryRepository;
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
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Tag(name = "Category Catalog", description = "Các API lấy danh mục sản phẩm")
public class CategoryController {

    private final CategoryRepository categoryRepository;

    @GetMapping
    @Transactional(readOnly = true)
    @Operation(summary = "Lấy danh sách tất cả danh mục sản phẩm từ CSDL")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories() {
        List<CategoryResponse> categories = categoryRepository.findAll().stream()
                .filter(c -> Boolean.TRUE.equals(c.getIsActive()))
                .map(c -> CategoryResponse.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .slug(c.getSlug())
                        .description(c.getDescription())
                        .isActive(c.getIsActive())
                        .productCount(c.getProducts() != null ? c.getProducts().size() : 0)
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(categories));
    }
}
