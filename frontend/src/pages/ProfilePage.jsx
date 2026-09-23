import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  User,
  Package,
  ShoppingBag,
  Truck,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  ArrowRight,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  X,
  Filter,
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useCartStore } from '../stores/useCartStore';
import { orderService } from '../services/orderService';
import { userService } from '../services/userService';
import { aiService } from '../services/aiService';
import { formatCurrency } from '../lib/utils';

export function ProfilePage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Xác định tab mặc định: ưu tiên query param, pathname (/my-orders) hoặc mặc định là 'orders'
  const getResolvedTab = useCallback(() => {
    const searchParams = new URLSearchParams(location.search);
    const queryTab = searchParams.get('tab');
    if (queryTab) return queryTab;
    if (location.pathname.includes('my-orders') || location.pathname.includes('orders')) {
      return 'orders';
    }
    return 'orders';
  }, [location.search, location.pathname]);

  const [activeTab, setActiveTab] = useState(getResolvedTab);
  const { user, role, isAuthenticated, updateUser } = useAuthStore();

  // Orders State
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [orderFilter, setOrderFilter] = useState('ALL');
  const [copiedCode, setCopiedCode] = useState(null);

  // Account Info Form State
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    createdAt: user?.createdAt || '',
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // AI Fit State (cho tab phụ AI Fit)
  const [aiProfile, setAiProfile] = useState(null);

  // Toast thông báo cục bộ
  const [toast, setToast] = useState(null);

  const { addToCart } = useCartStore();

  // Đồng bộ tab từ URL search params khi thay đổi
  useEffect(() => {
    setActiveTab(getResolvedTab());
  }, [getResolvedTab]);

  // 1. Fetch Lịch Sử Đơn Hàng từ Backend (/api/orders/my-orders)
  const fetchMyOrders = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingOrders(true);
    try {
      const res = await orderService.getMyOrders();
      const data = res?.data?.content || (Array.isArray(res?.data) ? res.data : []) || (Array.isArray(res) ? res : []) || [];
      setOrders(data);
    } catch (err) {
      console.error('Không thể tải lịch sử đơn hàng:', err);
      setOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchMyOrders();
  }, [fetchMyOrders]);

  // 2. Fetch Thông Tin Tài Khoản từ Backend (/api/users/profile)
  const fetchUserProfile = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingProfile(true);
    try {
      const res = await userService.getProfile();
      const data = res?.data || res;
      if (data) {
        setProfileData({
          fullName: data.fullName || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          createdAt: data.createdAt || '',
        });
        // Cập nhật lại zustand store để đồng bộ toàn app
        updateUser({
          fullName: data.fullName,
          phone: data.phone,
          address: data.address,
        });
      }
    } catch (err) {
      console.error('Không thể tải thông tin tài khoản:', err);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [isAuthenticated, updateUser]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // 3. Fetch Hồ sơ AI Fit (Tab AI Fit)
  useEffect(() => {
    if (isAuthenticated) {
      aiService
        .getMyProfile()
        .then((res) => {
          if (res?.data) setAiProfile(res.data);
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  // Xử lý sao chép mã đơn hàng
  const handleCopyOrderCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Xử lý Lưu / Cập nhật thông tin tài khoản (PUT /api/users/profile)
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileData.fullName.trim()) {
      setProfileErrorMsg('Vui lòng nhập họ và tên của bạn');
      return;
    }

    setIsSavingProfile(true);
    setProfileSuccessMsg('');
    setProfileErrorMsg('');

    try {
      const res = await userService.updateProfile({
        fullName: profileData.fullName.trim(),
        phone: profileData.phone.trim(),
        address: profileData.address.trim(),
      });
      const updated = res?.data || res;

      // Cập nhật Zustand store & local state
      updateUser({
        fullName: updated.fullName,
        phone: updated.phone,
        address: updated.address,
      });

      setProfileSuccessMsg('✓ Đã cập nhật thông tin tài khoản thành công!');
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Lỗi khi cập nhật profile:', err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại!';
      setProfileErrorMsg(msg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Xử lý chức năng "Mua lại" (Re-order)
  const handleReorder = (order) => {
    if (!order.items || order.items.length === 0) {
      setToast({
        title: 'KHÔNG THỂ MUA LẠI',
        message: 'Đơn hàng này không có thông tin sản phẩm hợp lệ.',
        isError: true,
      });
      return;
    }

    let addedCount = 0;
    order.items.forEach((item) => {
      addToCart(
        {
          id: String(item.variantId || item.id || Math.random()),
          variantId: item.variantId,
          sku: item.sku,
          name: item.productName || 'Giày Sneaker NewMos',
          price: Number(item.unitPrice || item.price || 0),
          image: item.productImage || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
          color: item.color || 'Bản Tiêu Chuẩn',
          quantity: item.quantity || 1,
        },
        item.size || '42'
      );
      addedCount += item.quantity || 1;
    });

    setToast({
      title: 'ĐÃ THÊM VÀO GIỎ HÀNG',
      message: `Đã thêm ${addedCount} sản phẩm từ đơn ${order.orderCode} vào giỏ hàng. Đang chuyển tới trang thanh toán...`,
      isError: false,
    });

    setTimeout(() => {
      navigate('/checkout');
    }, 1000);
  };

  // Cấu hình nhãn và màu sắc Badge trạng thái đơn hàng theo đúng tiêu chuẩn NewMos
  const getStatusBadge = (statusKey) => {
    const key = (statusKey || 'PENDING').toUpperCase();
    switch (key) {
      case 'PENDING':
        return {
          label: 'Chờ Xử Lý',
          dotColor: 'bg-amber-500',
          className: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'CONFIRMED':
      case 'PROCESSING':
        return {
          label: 'Đã Xác Nhận',
          dotColor: 'bg-blue-600',
          className: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'SHIPPING':
      case 'SHIPPED':
        return {
          label: 'Đang Giao Hàng',
          dotColor: 'bg-orange-500',
          className: 'bg-orange-50 text-orange-700 border-orange-200',
        };
      case 'DELIVERED':
      case 'COMPLETED':
        return {
          label: 'Giao Thành Công',
          dotColor: 'bg-emerald-600',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'CANCELLED':
        return {
          label: 'Đã Hủy',
          dotColor: 'bg-red-600',
          className: 'bg-red-50 text-red-700 border-red-200',
        };
      default:
        return {
          label: 'Đang Xử Lý',
          dotColor: 'bg-slate-500',
          className: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  // Lọc đơn hàng theo Filter pill
  const filteredOrders = orders.filter((ord) => {
    if (orderFilter === 'ALL') return true;
    const st = (ord.orderStatus || '').toUpperCase();
    if (orderFilter === 'PENDING') return st === 'PENDING';
    if (orderFilter === 'CONFIRMED') return st === 'CONFIRMED' || st === 'PROCESSING';
    if (orderFilter === 'SHIPPING') return st === 'SHIPPING' || st === 'SHIPPED';
    if (orderFilter === 'DELIVERED') return st === 'DELIVERED' || st === 'COMPLETED';
    if (orderFilter === 'CANCELLED') return st === 'CANCELLED';
    return true;
  });

  // Avatar Initials
  const getUserInitials = () => {
    if (profileData.fullName) {
      const parts = profileData.fullName.trim().split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return profileData.fullName.substring(0, 2).toUpperCase();
    }
    return user?.email ? user.email.substring(0, 2).toUpperCase() : 'NM';
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8 sm:py-12 text-slate-900 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Toast thông báo */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-2xl shadow-2xl border flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-200 ${
              toast.isError
                ? 'bg-red-950 text-white border-red-700'
                : 'bg-[#0A0A0A] text-white border-neutral-700'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                toast.isError ? 'bg-red-600 text-white' : 'bg-emerald-500 text-white'
              }`}
            >
              {toast.isError ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            </div>
            <div className="flex-1">
              <h5 className="font-bold text-xs uppercase tracking-wider font-mono">
                {toast.title}
              </h5>
              <p className="text-xs text-neutral-300 mt-0.5 leading-relaxed font-sans">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========================================================
            1. HEADER PROFILE CARD - PHONG CÁCH THỂ THAO NEWMOS
           ======================================================== */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm relative overflow-hidden">
          {/* Background Accent Gradients */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-red-600/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-slate-900/5 rounded-full blur-2xl pointer-events-none -ml-16 -mb-16" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            
            {/* Avatar & User Details */}
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="relative">
                <div className="w-18 h-18 rounded-2xl bg-[#0A0A0A] text-white flex items-center justify-center font-display font-black text-2xl border-2 border-[#DC2626] shadow-xl shadow-red-600/20">
                  {getUserInitials()}
                </div>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">
                  ✓
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-[#0A0A0A] font-display uppercase tracking-tight">
                    {profileData.fullName || user?.fullName || 'Khách Hàng NewMos'}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-[#DC2626] border border-red-200 text-[10px] font-black uppercase font-mono tracking-wider">
                    {role === 'ROLE_ADMIN' ? 'QUẢN TRỊ VIÊN' : 'VIP KINETIC MEMBER'}
                  </span>
                </div>
                
                <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{profileData.email || user?.email}</span>
                  </span>
                  {profileData.phone && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{profileData.phone}</span>
                      </span>
                    </>
                  )}
                  {profileData.createdAt && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Gia nhập {new Date(profileData.createdAt).toLocaleDateString('vi-VN')}</span>
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <div className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-center flex-1 sm:flex-initial">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                  TỔNG ĐƠN HÀNG
                </span>
                <span className="text-lg font-black font-mono text-[#0A0A0A]">
                  {orders.length}
                </span>
              </div>

              <div className="px-4 py-2.5 rounded-2xl bg-red-50/70 border border-red-200 text-center flex-1 sm:flex-initial">
                <span className="text-[10px] font-mono uppercase font-bold text-red-600 block">
                  ĐƠN ĐANG GIAO
                </span>
                <span className="text-lg font-black font-mono text-red-600">
                  {orders.filter((o) => ['PENDING', 'CONFIRMED', 'SHIPPING', 'PROCESSING'].includes(o.orderStatus)).length}
                </span>
              </div>
            </div>

          </div>

          {/* ========================================================
              TAB NAVIGATION BAR (2 TAB CHÍNH + TAB AI FIT)
             ======================================================== */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center gap-2 sm:gap-4 overflow-x-auto scrollbar-none">
            {/* Tab 1: Đơn Hàng Của Tôi */}
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-[#0A0A0A] text-white shadow-md shadow-black/20'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Package className={`w-4 h-4 ${activeTab === 'orders' ? 'text-red-500' : 'text-slate-500'}`} />
              <span>Đơn Hàng Của Tôi</span>
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'orders' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {orders.length}
              </span>
            </button>

            {/* Tab 2: Thông Tin Tài Khoản */}
            <button
              onClick={() => setActiveTab('account')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'account'
                  ? 'bg-[#0A0A0A] text-white shadow-md shadow-black/20'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <User className={`w-4 h-4 ${activeTab === 'account' ? 'text-red-500' : 'text-slate-500'}`} />
              <span>Thông Tin Tài Khoản</span>
            </button>

            {/* Tab 3 (Bonus): Hồ Sơ AI Fit */}
            <button
              onClick={() => setActiveTab('ai-fit')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'ai-fit'
                  ? 'bg-[#0A0A0A] text-white shadow-md shadow-black/20'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${activeTab === 'ai-fit' ? 'text-red-500' : 'text-slate-500'}`} />
              <span>Hồ Sơ Đo Chân AI Fit</span>
            </button>
          </div>

        </div>

        {/* ========================================================
            TAB 1: LỊCH SỬ ĐƠN HÀNG CỦA TÔI (MY ORDERS)
           ======================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6">

            {/* Bộ Lọc Trạng Thái Đơn Hàng (Status Filters) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                <Filter className="w-3.5 h-3.5 text-red-600" />
                <span>Trạng thái:</span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {[
                  { id: 'ALL', label: 'Tất Cả' },
                  { id: 'PENDING', label: 'Chờ Xử Lý' },
                  { id: 'CONFIRMED', label: 'Đã Xác Nhận' },
                  { id: 'SHIPPING', label: 'Đang Giao' },
                  { id: 'DELIVERED', label: 'Giao Thành Công' },
                  { id: 'CANCELLED', label: 'Đã Hủy' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setOrderFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      orderFilter === f.id
                        ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Danh Sách Đơn Hàng */}
            {isLoadingOrders ? (
              /* Loading Skeletons */
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 animate-pulse"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div className="h-5 w-40 bg-slate-200 rounded-md" />
                      <div className="h-6 w-28 bg-slate-200 rounded-full" />
                    </div>
                    <div className="flex items-center gap-4 py-2">
                      <div className="w-16 h-16 bg-slate-200 rounded-xl shrink-0" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-1/2 bg-slate-200 rounded-md" />
                        <div className="h-3 w-1/4 bg-slate-200 rounded-md" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="h-5 w-32 bg-slate-200 rounded-md" />
                      <div className="h-9 w-48 bg-slate-200 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              /* Trạng Thái Trống (Empty State) */
              <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center space-y-4 shadow-sm">
                <div className="w-20 h-20 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border-2 border-red-200">
                  <ShoppingBag className="w-10 h-10 stroke-[1.8]" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="text-base sm:text-lg font-black text-[#0A0A0A] uppercase tracking-tight font-display">
                    Bạn Chưa Có Đơn Hàng Nào
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    {orderFilter === 'ALL'
                      ? 'Khám phá ngay bộ sưu tập giày Sneaker công nghệ AI NewMos và tận hưởng trải nghiệm mua sắm đỉnh cao với chuẩn size vừa vặn.'
                      : `Không tìm thấy đơn hàng nào ở trạng thái "${orderFilter}". Hãy thử chọn bộ lọc khác.`}
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    to="/shop"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all cursor-pointer active:scale-98"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Khám Phá Bộ Sưu Tập Ngay</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            ) : (
              /* Danh Sách Card Đơn Hàng Thể Thao (Header - Body - Footer) */
              <div className="space-y-5">
                {filteredOrders.map((order) => {
                  const statusInfo = getStatusBadge(order.orderStatus);
                  const items = order.items || [];
                  const orderDate = order.createdAt
                    ? new Date(order.createdAt).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Vừa xong';

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:border-slate-300 transition-all overflow-hidden"
                    >
                      {/* 1. HEADER CARD: Mã đơn hàng, Ngày đặt, Badge trạng thái */}
                      <div className="p-4 sm:p-5 bg-slate-50/80 border-b border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono uppercase font-bold text-slate-500">Mã đơn:</span>
                            <span className="font-mono font-black text-sm text-[#0A0A0A] tracking-wider select-all">
                              {order.orderCode || `NM-${order.id}`}
                            </span>
                            <button
                              onClick={() => handleCopyOrderCode(order.orderCode || `NM-${order.id}`)}
                              className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-white transition-all cursor-pointer"
                              title="Sao chép mã đơn"
                            >
                              {copiedCode === (order.orderCode || `NM-${order.id}`) ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          <span className="text-slate-300 hidden sm:inline">•</span>

                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{orderDate}</span>
                          </div>
                        </div>

                        {/* Badge trạng thái */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase font-mono tracking-wider border ${statusInfo.className}`}
                          >
                            <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`} />
                            <span>{statusInfo.label}</span>
                          </span>
                        </div>
                      </div>

                      {/* 2. BODY CARD: Danh sách sản phẩm trong đơn */}
                      <div className="p-4 sm:p-6 divide-y divide-slate-100">
                        {items.length > 0 ? (
                          items.map((item, idx) => (
                            <div
                              key={idx}
                              className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                                <img
                                  src={
                                    item.productImage ||
                                    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=200&q=80'
                                  }
                                  alt={item.productName}
                                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover bg-slate-50 border border-slate-200 shrink-0"
                                />
                                <div className="min-w-0">
                                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                    {item.productName}
                                  </h4>
                                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-1 flex-wrap">
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-700">
                                      Size {item.size} EU
                                    </span>
                                    {item.color && (
                                      <span className="text-slate-600 font-medium">
                                        • {item.color}
                                      </span>
                                    )}
                                    <span>
                                      • SL: <strong className="text-slate-800">x{item.quantity}</strong>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <div className="text-xs sm:text-sm font-mono font-black text-slate-900">
                                  {formatCurrency(Number(item.totalPrice || item.unitPrice * item.quantity))}
                                </div>
                                <span className="text-[10px] text-slate-400 block font-mono">
                                  {formatCurrency(Number(item.unitPrice || item.price))}/đôi
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-2 text-xs text-slate-500 font-mono">
                            Chi tiết sản phẩm giày NewMos chính hãng
                          </div>
                        )}
                      </div>

                      {/* 3. FOOTER CARD: Tổng tiền thanh toán (VNĐ) & Nút hành động */}
                      <div className="p-4 sm:p-5 bg-slate-50/50 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                            Tổng tiền thanh toán
                          </span>
                          <div className="text-lg sm:text-xl font-mono font-black text-red-600">
                            {formatCurrency(Number(order.totalAmount || 0))}
                          </div>
                        </div>

                        {/* Nút Hành Động: "Xem Chi Tiết / Theo Dõi" và "Mua Lại" */}
                        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                          {/* Nút Xem chi tiết / Theo dõi */}
                          <button
                            onClick={() =>
                              navigate(
                                `/order-tracking?orderId=${encodeURIComponent(
                                  order.orderCode || order.id
                                )}`
                              )
                            }
                            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-300 hover:border-slate-900 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
                          >
                            <Truck className="w-3.5 h-3.5 text-red-600" />
                            <span>Theo Dõi Đơn</span>
                          </button>

                          {/* Nút Mua lại */}
                          <button
                            onClick={() => handleReorder(order)}
                            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-red-600/25 active:scale-98"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-white" />
                            <span>Mua Lại</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* ========================================================
            TAB 2: THÔNG TIN TÀI KHOẢN (ACCOUNT INFO)
           ======================================================== */}
        {activeTab === 'account' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-sm space-y-6">
              
              <div className="border-b border-slate-100 pb-4 space-y-1">
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-[#0A0A0A] font-display flex items-center gap-2">
                  <User className="w-5 h-5 text-red-600" />
                  <span>Hồ Sơ Cá Nhân & Địa Chỉ Giao Hàng</span>
                </h3>
                <p className="text-xs text-slate-500 font-sans">
                  Quản lý thông tin tài khoản NewMos để tối ưu tốc độ đặt hàng và kích hoạt bảo hành điện tử.
                </p>
              </div>

              {/* Thông báo thành công / lỗi */}
              {profileSuccessMsg && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              {profileErrorMsg && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{profileErrorMsg}</span>
                </div>
              )}

              {isLoadingProfile ? (
                <div className="py-12 text-center text-slate-400 text-xs font-mono animate-pulse">
                  Đang tải thông tin tài khoản...
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="space-y-5 text-xs">
                  
                  {/* Họ và tên */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-700 font-bold uppercase font-mono text-[11px]">
                      Họ và tên <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={profileData.fullName}
                      onChange={(e) =>
                        setProfileData({ ...profileData, fullName: e.target.value })
                      }
                      placeholder="Ví dụ: Nguyễn Văn An"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all font-sans"
                    />
                  </div>

                  {/* Email (Disabled / Readonly) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-slate-700 font-bold uppercase font-mono text-[11px]">
                        Địa chỉ Email
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Cố định theo tài khoản
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="email"
                        disabled
                        value={profileData.email}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-100 text-slate-500 text-sm cursor-not-allowed font-mono"
                      />
                      <span className="absolute right-3.5 top-3.5 text-[11px] font-bold text-slate-400 font-mono">
                        LOCKED
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Email dùng để nhận hóa đơn điện tử và mã xác thực giao dịch, không thể thay đổi trực tiếp.
                    </p>
                  </div>

                  {/* Số điện thoại */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-700 font-bold uppercase font-mono text-[11px]">
                      Số điện thoại nhận hàng
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData({ ...profileData, phone: e.target.value })
                      }
                      placeholder="Ví dụ: 0912 345 678"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-slate-900 text-sm font-mono focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                    />
                  </div>

                  {/* Địa chỉ giao hàng mặc định */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-700 font-bold uppercase font-mono text-[11px]">
                      Địa chỉ nhận hàng mặc định
                    </label>
                    <textarea
                      rows={3}
                      value={profileData.address}
                      onChange={(e) =>
                        setProfileData({ ...profileData, address: e.target.value })
                      }
                      placeholder="Ví dụ: Số 123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all font-sans leading-relaxed"
                    />
                    <p className="text-[11px] text-slate-400">
                      Địa chỉ này sẽ được tự động điền sẵn tại trang Thanh Toán (Checkout) để giúp bạn mua giày siêu tốc.
                    </p>
                  </div>

                  {/* Nút Cập nhật thông tin */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
                    >
                      {isSavingProfile ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Đang lưu thông tin...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Cập Nhật Thông Tin</span>
                        </>
                      )}
                    </button>
                  </div>

                </form>
              )}

            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3 (BONUS): HỒ SƠ ĐO CHÂN AI FIT TELEMETRY
           ======================================================== */}
        {activeTab === 'ai-fit' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-black uppercase text-[#0A0A0A] font-display flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-red-600" />
                    <span>Dữ Liệu Số Đo Bàn Chân NewMos Fit</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-sans mt-0.5">
                    Hệ thống NewMos tự động đối chiếu thông số chiều dài và dáng chân của bạn với từng form giày thể thao.
                  </p>
                </div>

                <Link
                  to="/ai-fit"
                  className="px-4 py-2 rounded-xl bg-[#0A0A0A] hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 self-start sm:self-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-red-500" />
                  <span>Đo & Cập Nhật Size</span>
                </Link>
              </div>

              {/* Thông số đo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                    CHIỀU DÀI BÀN CHÂN
                  </span>
                  <div className="text-xl font-mono font-black text-slate-900 mt-1">
                    {aiProfile?.footLengthCm ? Math.round(aiProfile.footLengthCm * 10) : 265} MM
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {aiProfile?.footLengthCm ? `Chuẩn ${aiProfile.footLengthCm} cm` : 'Chuẩn 26.5 cm'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                    ĐỘ RỘNG BÀN CHÂN
                  </span>
                  <div className="text-xl font-mono font-black text-slate-900 mt-1">
                    {aiProfile?.footWidthCm ? Math.round(aiProfile.footWidthCm * 10) : 102} MM
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {aiProfile?.footShape === 'WIDE'
                      ? 'Bè ngang (Wide)'
                      : aiProfile?.footShape === 'SLIM'
                      ? 'Thon gọn (Slim)'
                      : 'Tiêu chuẩn'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                    VÒM CHÂN (ARCH)
                  </span>
                  <div className="text-xl font-mono font-black text-red-600 mt-1">
                    {aiProfile?.archType === 'LOW_FLAT'
                      ? 'VÒM BẸT'
                      : aiProfile?.archType === 'HIGH'
                      ? 'VÒM CAO'
                      : 'VÒM CHUẨN'}
                  </div>
                  <span className="text-[10px] text-slate-500">Chống lật bàn chân</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                    SIZE KHUYÊN DÙNG
                  </span>
                  <div className="text-xl font-mono font-black text-emerald-600 mt-1">
                    {aiProfile?.recommendedSizeEu ? `${aiProfile.recommendedSizeEu} EU` : '42.5 EU'}
                  </div>
                  <span className="text-[10px] text-slate-500">Độ tin cậy 99%</span>
                </div>
              </div>

              {/* Lời khuyên fitting */}
              {aiProfile?.fittingAdvice && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-slate-800 space-y-1">
                  <strong className="text-red-700 block font-mono uppercase">
                    Lời khuyên chọn giày chuyên biệt:
                  </strong>
                  <p className="leading-relaxed font-sans">{aiProfile.fittingAdvice}</p>
                </div>
              )}

              <div className="pt-2">
                <Link
                  to="/shop"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Mua Giày Chuẩn Form Ngay</span>
                </Link>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default ProfilePage;
