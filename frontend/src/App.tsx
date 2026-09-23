import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { WishlistPage } from './pages/WishlistPage';
import { AuthPage } from './pages/AuthPage';
import { AIFitStudioPage } from './pages/AIFitStudioPage';
import { SizeGuidePage } from './pages/SizeGuidePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { PageLoadingSpinner } from './components/common/PageLoadingSpinner';

// Dynamic Import (Code-splitting) cho các phân hệ nặng
const AdminPage = lazy(() => import('./pages/AdminPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage'));

// Tự động cuộn lên đầu trang mỗi khi chuyển route
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* MainLayout dùng chung 100% cho toàn bộ các trang trong website */}
        <Route element={<MainLayout />}>
          {/* 1. Các màn hình cốt lõi E-commerce */}
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/product" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoadingSpinner />}>
                  <ProfilePage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-orders"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoadingSpinner />}>
                  <ProfilePage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/orders"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoadingSpinner />}>
                  <ProfilePage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route path="/ai-fit" element={<AIFitStudioPage />} />

          {/* 2. Trang Quản Trị Hệ Thống: Bảo vệ nghiêm ngặt bằng ROLE_ADMIN */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="ROLE_ADMIN">
                <Suspense fallback={<PageLoadingSpinner />}>
                  <AdminPage />
                </Suspense>
              </ProtectedRoute>
            }
          />

          {/* 3. Các màn hình bổ trợ quan trọng */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/register" element={<Navigate to="/auth" replace />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />
          <Route
            path="/order-tracking"
            element={
              <Suspense fallback={<PageLoadingSpinner />}>
                <OrderTrackingPage />
              </Suspense>
            }
          />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/size-guide" element={<SizeGuidePage />} />
          <Route path="/policy" element={<SizeGuidePage />} />

          {/* 4. Màn hình lỗi 404 & Wildcard fallback */}
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
