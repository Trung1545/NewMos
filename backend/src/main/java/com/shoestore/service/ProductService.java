package com.shoestore.service;

import com.shoestore.dto.request.ProductFilterRequest;
import com.shoestore.dto.response.ProductResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface ProductService {

    Page<ProductResponse> getProducts(ProductFilterRequest filter);

    ProductResponse getProductById(Long id);

    ProductResponse getProductBySlug(String slug);

    List<ProductResponse> getFeaturedProducts();
}
