package com.shoestore.repository;

import com.shoestore.entity.Product;
import com.shoestore.entity.enums.Gender;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    Optional<Product> findBySlug(String slug);

    Optional<Product> findByCode(String code);

    Boolean existsByCode(String code);

    Boolean existsBySlug(String slug);

    @Query("SELECT DISTINCT p FROM Product p " +
           "LEFT JOIN FETCH p.variants v " +
           "LEFT JOIN FETCH p.brand b " +
           "LEFT JOIN FETCH p.category c " +
           "WHERE p.id = :id")
    Optional<Product> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT DISTINCT p FROM Product p " +
           "LEFT JOIN FETCH p.variants v " +
           "LEFT JOIN FETCH p.brand b " +
           "LEFT JOIN FETCH p.category c " +
           "WHERE p.slug = :slug")
    Optional<Product> findBySlugWithDetails(@Param("slug") String slug);

    @Query("SELECT p FROM Product p WHERE p.isActive = true AND " +
           "(:keyword IS NULL OR LOWER(p.name) LIKE CONCAT('%', :keyword, '%') OR LOWER(p.code) LIKE CONCAT('%', :keyword, '%')) AND " +
           "(:brand IS NULL OR LOWER(p.brand.name) = :brand OR LOWER(p.brand.code) = :brand) AND " +
           "(:category IS NULL OR LOWER(p.category.slug) = :category OR LOWER(p.category.name) = :category) AND " +
           "(:gender IS NULL OR p.gender = :gender) AND " +
           "(:isFeatured IS NULL OR p.isFeatured = :isFeatured)")
    Page<Product> filterProducts(
            @Param("keyword") String keyword,
            @Param("brand") String brand,
            @Param("category") String category,
            @Param("gender") Gender gender,
            @Param("isFeatured") Boolean isFeatured,
            Pageable pageable
    );

    @Query("SELECT DISTINCT p FROM Product p " +
           "LEFT JOIN FETCH p.variants v " +
           "LEFT JOIN FETCH p.brand b " +
           "LEFT JOIN FETCH p.category c " +
           "ORDER BY p.id DESC")
    java.util.List<Product> findAllWithVariantsAndDetails();
}
