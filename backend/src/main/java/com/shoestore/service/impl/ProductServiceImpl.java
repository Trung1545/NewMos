package com.shoestore.service.impl;

import com.shoestore.dto.request.ProductFilterRequest;
import com.shoestore.dto.response.ProductResponse;
import com.shoestore.entity.Product;
import com.shoestore.exception.ResourceNotFoundException;
import com.shoestore.mapper.ProductMapper;
import com.shoestore.repository.ProductRepository;
import com.shoestore.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.shoestore.entity.Brand;
import com.shoestore.entity.Category;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponse> getProducts(ProductFilterRequest filter) {
        Sort sort = switch (filter.getSortBy() != null ? filter.getSortBy() : "newest") {
            case "priceAsc" -> Sort.by(Sort.Direction.ASC, "id");
            case "priceDesc" -> Sort.by(Sort.Direction.DESC, "id");
            case "nameAsc" -> Sort.by(Sort.Direction.ASC, "name");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };

        Pageable pageable = PageRequest.of(Math.max(0, filter.getPage()), Math.max(1, filter.getPageSize()), sort);

        Specification<Product> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isTrue(root.get("isActive")));

            if (filter.getQ() != null && !filter.getQ().isBlank()) {
                String pattern = "%" + filter.getQ().trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), pattern),
                        cb.like(cb.lower(root.get("code")), pattern)
                ));
            }
            if (filter.getBrand() != null && !filter.getBrand().isBlank()) {
                String br = filter.getBrand().trim().toLowerCase();
                Join<Product, Brand> brandJoin = root.join("brand", JoinType.LEFT);
                predicates.add(cb.or(
                        cb.equal(cb.lower(brandJoin.get("name")), br),
                        cb.equal(cb.lower(brandJoin.get("code")), br)
                ));
            }
            if (filter.getCategory() != null && !filter.getCategory().isBlank()) {
                String cat = filter.getCategory().trim().toLowerCase();
                Join<Product, Category> catJoin = root.join("category", JoinType.LEFT);
                predicates.add(cb.or(
                        cb.equal(cb.lower(catJoin.get("slug")), cat),
                        cb.equal(cb.lower(catJoin.get("name")), cat)
                ));
            }
            if (filter.getGender() != null) {
                predicates.add(cb.equal(root.get("gender"), filter.getGender()));
            }
            if (filter.getIsFeatured() != null) {
                predicates.add(cb.equal(root.get("isFeatured"), filter.getIsFeatured()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Product> productPage = productRepository.findAll(spec, pageable);

        return productPage.map(productMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm", "id", id));

        return productMapper.toResponse(product);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getProductBySlug(String slug) {
        Product product = productRepository.findBySlugWithDetails(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm", "slug", slug));

        return productMapper.toResponse(product);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getFeaturedProducts() {
        Pageable pageable = PageRequest.of(0, 8, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Product> featuredPage = productRepository.filterProducts(null, null, null, null, true, pageable);

        return featuredPage.getContent().stream()
                .map(productMapper::toResponse)
                .collect(Collectors.toList());
    }
}
