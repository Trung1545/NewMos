package com.shoestore;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Điểm khởi chạy chính của ứng dụng Shoe Store E-Commerce & AI Sizing Backend
 */
@SpringBootApplication
@EnableJpaAuditing
public class ShoeStoreApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShoeStoreApplication.class, args);
    }
}
