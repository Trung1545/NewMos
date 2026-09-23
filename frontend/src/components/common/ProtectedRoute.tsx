import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

/**
 * ProtectedRoute: Bọc các route yêu cầu xác thực (ví dụ: /profile, /admin)
 * - Nếu chưa đăng nhập: Tự động chuyển hướng về trang /auth kèm location trước đó
 * - Nếu yêu cầu role cụ thể (như ROLE_ADMIN): Kiểm tra quyền của người dùng
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, role, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const userRole = role || user?.role;
    const userRoles = user?.roles || [];
    const hasRole =
      userRole === requiredRole ||
      userRoles.includes(requiredRole) ||
      (requiredRole === 'ROLE_ADMIN' && (userRole === 'ADMIN' || userRoles.includes('ADMIN')));

    if (!hasRole) {
      return (
        <Navigate
          to="/"
          state={{
            unauthorized: true,
            title: 'HẠN CHẾ QUYỀN TRUY CẬP',
            message: 'Tài khoản của bạn không có quyền truy cập vào trang Quản Trị Hệ Thống (Yêu cầu quyền Quản trị viên - ROLE_ADMIN).',
          }}
          replace
        />
      );
    }
  }

  return <>{children}</>;
}

export default ProtectedRoute;
