package com.shoestore.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;

/**
 * Runner kiểm tra kết nối CSDL PostgreSQL khi ứng dụng khởi động.
 */
@Slf4j
@Order(1)
@Component
@RequiredArgsConstructor
public class DatabaseConnectionChecker implements CommandLineRunner {

    private final DataSource dataSource;

    @Override
    public void run(String... args) throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            String dbProductName = connection.getMetaData().getDatabaseProductName();
            String catalog = connection.getCatalog();
            log.info("====================================================================");
            log.info("[ShoeStore] Kết nối PostgreSQL thành công và đã đồng bộ bảng!");
            log.info("Database Engine: {} | Active DB: {}", dbProductName, catalog);
            log.info("====================================================================");
            System.out.println("[ShoeStore] Kết nối PostgreSQL thành công và đã đồng bộ bảng!");
        } catch (Exception e) {
            log.error("[ShoeStore] Không thể kết nối tới cơ sở dữ liệu: {}", e.getMessage());
            throw e;
        }
    }
}
