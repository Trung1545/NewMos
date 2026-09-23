import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { Footer } from '../components/common/Footer';
import { MiniCartDrawer } from '../components/cart/MiniCartDrawer';
import { AISizingModal } from '../components/ai/AISizingModal';
import { AIVisualSearchModal } from '../components/ai/AIVisualSearchModal';
import { NewMosChatbot } from '../components/chat/NewMosChatbot';
import { Toast } from '../components/common/Toast';

export function MainLayout({ children = null } = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (location.state?.unauthorized) {
      setToast({
        title: location.state.title || 'HẠN CHẾ QUYỀN TRUY CẬP',
        message: location.state.message || 'Bạn không có quyền truy cập trang Quản Trị.',
        isError: true,
      });

      // Xóa state để không hiển thị lại khi reload hoặc navigate
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#0A0A0A] flex flex-col selection:bg-[#DC2626] selection:text-white font-sans antialiased">
      {/* 1. Header dùng chung duy nhất cho toàn bộ hệ thống */}
      <Header />

      {/* 2. Vùng hiển thị Route con thông qua Outlet của react-router-dom */}
      <main className="flex-1 w-full">
        {children || <Outlet />}
      </main>

      {/* 3. Footer dùng chung duy nhất */}
      <Footer />

      {/* 4. Các Modal & Drawer toàn cục (Global UI Subsystems) */}
      <MiniCartDrawer />
      <AISizingModal />
      <AIVisualSearchModal />
      <NewMosChatbot />
      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}

export default MainLayout;
