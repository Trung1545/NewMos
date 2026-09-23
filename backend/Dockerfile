# =========================================================================
# Stage 1: Build stage with Maven & Eclipse Temurin JDK 17
# =========================================================================
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /app

# Tận dụng Docker layer caching: tải trước dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy mã nguồn và đóng gói JAR
COPY src ./src
RUN mvn clean package -DskipTests

# =========================================================================
# Stage 2: Runtime stage with lightweight JRE 17 Alpine
# =========================================================================
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Tạo non-root user 'newmos' để chạy container an toàn
RUN addgroup -S newmos && adduser -S newmos -G newmos

# Sao chép artifact từ build stage
COPY --from=builder /app/target/*.jar app.jar

# Phân quyền thư mục ứng dụng cho user newmos
RUN chown -R newmos:newmos /app

USER newmos

EXPOSE 8080

# Cấu hình container-aware memory management
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
