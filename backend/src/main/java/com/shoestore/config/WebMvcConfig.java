package com.shoestore.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/**
 * Cấu hình Static Resource Handlers phục vụ ảnh tĩnh cho toàn hệ thống.
 * Cho phép truy cập ảnh sản phẩm trực tiếp qua /images/products/...
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String frontendImagesUri = Paths.get("..", "frontend", "public", "images").toAbsolutePath().normalize().toUri().toString();
        String currentDirImagesUri = Paths.get("src", "main", "resources", "static", "images").toAbsolutePath().normalize().toUri().toString();

        registry.addResourceHandler("/images/**")
                .addResourceLocations(
                        "classpath:/static/images/",
                        currentDirImagesUri,
                        frontendImagesUri,
                        "file:./uploads/images/"
                )
                .setCachePeriod(3600);
    }
}
