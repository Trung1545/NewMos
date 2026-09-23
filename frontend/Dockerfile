# =========================================================================
# Stage 1: Build Frontend với Node.js 20 Alpine
# =========================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy các tệp định nghĩa dependencies để tận dụng Docker cache layer
COPY package*.json ./
RUN npm ci

# Copy toàn bộ mã nguồn frontend và tiến hành build bundle
COPY . .
RUN npm run build

# =========================================================================
# Stage 2: Web Server Nginx Alpine phục vụ Static Files & Reverse Proxy
# =========================================================================
FROM nginx:alpine

# Copy toàn bộ file tĩnh đã biên dịch sang thư mục web root của Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy tệp cấu hình Nginx SPA Routing & Reverse Proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
