package com.shoestore.repository;

import com.shoestore.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderCode(String orderCode);

    @Query("SELECT o FROM Order o WHERE o.user.id = :userId ORDER BY o.createdAt DESC")
    Page<Order> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.user.id = :userId ORDER BY o.createdAt DESC")
    java.util.List<Order> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);

    Page<Order> findByRecipientPhoneOrderByCreatedAtDesc(String phone, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.orderCode = :orderCode AND " +
           "(:phone IS NULL OR o.recipientPhone LIKE CONCAT('%', :phone, '%'))")
    Optional<Order> trackGuestOrder(@Param("orderCode") String orderCode, @Param("phone") String phone);

    Boolean existsByOrderCode(String orderCode);
    
    java.util.List<Order> findAllByOrderByCreatedAtDesc();

    java.util.List<Order> findByOrderStatusOrderByCreatedAtDesc(com.shoestore.enums.OrderStatus orderStatus);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.orderStatus IN (com.shoestore.enums.OrderStatus.DELIVERED, com.shoestore.enums.OrderStatus.COMPLETED)")
    java.math.BigDecimal calculateTotalRealRevenue();

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.orderStatus IN (com.shoestore.enums.OrderStatus.DELIVERED, com.shoestore.enums.OrderStatus.COMPLETED) AND o.updatedAt >= :startDate")
    java.math.BigDecimal calculateRevenueFrom(@Param("startDate") java.time.LocalDateTime startDate);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.orderStatus IN (com.shoestore.enums.OrderStatus.PENDING, com.shoestore.enums.OrderStatus.CONFIRMED, com.shoestore.enums.OrderStatus.SHIPPING)")
    java.math.BigDecimal calculateTotalPendingRevenue();

    @Query("SELECT COUNT(o) FROM Order o WHERE o.orderStatus IN (com.shoestore.enums.OrderStatus.DELIVERED, com.shoestore.enums.OrderStatus.COMPLETED)")
    long countDeliveredOrders();

    long countByOrderStatus(com.shoestore.enums.OrderStatus orderStatus);
}
