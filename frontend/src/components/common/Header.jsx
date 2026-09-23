import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Heart,
  Search,
  Camera,
  Menu,
  X,
  User,
  Sparkles,
  Flame,
  LogIn,
  LogOut,
  Package,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';
import { useCartStore } from '../../stores/useCartStore';
import { useAIStore } from '../../stores/useAIStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { cn } from '../../lib/utils';

export function Header() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userMenuRef = useRef(null);

  const { cart, items, getTotalItems, toggleCart } = useCartStore();
  const { setModalOpen, setVisualSearchOpen, resetAI } = useAIStore();
  const { user, isAuthenticated, role, logout } = useAuthStore();

  const cartList = (cart && cart.length > 0) ? cart : (items || []);
  const totalItems = cartList.reduce((sum, item) => sum + (item.quantity || 1), 0);

  // Đóng dropdown tài khoản khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { name: 'Trang chủ', path: '/' },
    { name: 'Sản phẩm', path: '/shop' },
    { name: 'Hàng mới về', path: '/shop?tag=new' },
    { name: 'Nam', path: '/shop?gender=men' },
    { name: 'Nữ', path: '/shop?gender=women' },
    { name: 'Khuyến mãi', path: '/shop?sale=true', isSale: true },
    { name: 'Trợ lý AI Fit', path: '/ai-fit', isAI: true },
  ];

  const handleOpenAIFit = (e) => {
    if (e) e.preventDefault();
    resetAI();
    setModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const handleOpenVisualSearch = () => {
    setVisualSearchOpen(true);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const isAdmin = role === 'ROLE_ADMIN' || user?.roles?.includes('ROLE_ADMIN');

  // Lấy chữ cái viết tắt đại diện cho User Avatar
  const getUserInitials = () => {
    if (!user) return 'U';
    if (user.fullName) {
      const parts = user.fullName.trim().split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return user.fullName.substring(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="sticky top-0 z-40 w-full shadow-md">
      {/* Main Navbar: Cố định nền Đen #0A0A0A tương phản cao */}
      <div className="bg-[#0A0A0A] border-b border-[#262626] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 gap-4 sm:gap-6">
            {/* Logo Thương Hiệu Bên Trái */}
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform duration-200">
                <Flame className="w-5 h-5 text-white fill-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-black text-2xl tracking-wider leading-none text-white">
                  NEW<span className="text-red-600">MOS</span>
                </span>
                <span className="text-[9px] font-display font-semibold uppercase tracking-widest text-neutral-400 -mt-0.5 group-hover:text-red-400 transition-colors">
                  Sport Shoes & AI Fit
                </span>
              </div>
            </Link>

            {/* Danh Mục Điều Hướng Ở Giữa */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
              {navLinks.map((link) => {
                if (link.isAI) {
                  return (
                    <button
                      key={link.name}
                      onClick={handleOpenAIFit}
                      className="text-xs font-bold tracking-wider text-red-500 hover:text-red-400 uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 fill-red-500 animate-spin-slow" />
                      <span>{link.name}</span>
                    </button>
                  );
                }

                return (
                  <NavLink
                    key={link.name}
                    to={link.path}
                    className={({ isActive }) =>
                      cn(
                        'text-xs font-bold tracking-wider uppercase transition-colors relative py-1.5',
                        isActive
                          ? 'text-[#DC2626] border-b-2 border-[#DC2626]'
                          : 'text-neutral-300 hover:text-[#DC2626]',
                        link.isSale && 'text-red-500 hover:text-red-400 font-extrabold'
                      )
                    }
                  >
                    {link.name}
                    {link.isSale && (
                      <span className="ml-1 px-1 py-0.2 rounded-xs bg-red-600 text-white text-[9px] font-black uppercase">
                        Hot
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* Cụm Tiện Ích Bên Phải */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              {/* Thanh Tìm Kiếm Nhanh */}
              <form
                onSubmit={handleSearchSubmit}
                className="hidden md:flex relative w-44 lg:w-56"
              >
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm..."
                    className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-[#DC2626] transition-all font-sans"
                  />
                  <button
                    type="button"
                    onClick={handleOpenVisualSearch}
                    className="absolute inset-y-1 right-1 px-1.5 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-red-500 flex items-center justify-center transition-colors cursor-pointer"
                    title="Tìm kiếm bằng hình ảnh AI"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>

              {/* Icon Wishlist */}
              <button
                onClick={() => navigate('/wishlist')}
                className="p-2 rounded-lg text-neutral-300 hover:text-[#DC2626] hover:bg-neutral-900 transition-all cursor-pointer"
                aria-label="Yêu thích"
                title="Sản phẩm yêu thích"
              >
                <Heart className="w-4 h-4" />
              </button>

              {/* Icon Cart */}
              <button
                onClick={toggleCart}
                className="relative p-2 rounded-lg text-neutral-300 hover:text-[#DC2626] hover:bg-neutral-900 transition-all cursor-pointer group"
                aria-label="Giỏ hàng"
                title="Xem giỏ hàng"
              >
                <ShoppingBag className="w-4 h-4 text-neutral-200 group-hover:text-red-500 transition-colors" />
                {totalItems > 0 ? (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#DC2626] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md shadow-red-600/50 border border-[#0A0A0A] animate-bounce">
                    {totalItems}
                  </span>
                ) : (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#DC2626] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs border border-[#0A0A0A]">
                    0
                  </span>
                )}
              </button>

              {/* Authentication Controls */}
              {!isAuthenticated ? (
                /* Trạng thái chưa đăng nhập: Nút Đăng nhập */
                <Link
                  to="/auth"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 hover:border-[#DC2626] hover:bg-red-600 hover:text-white text-neutral-200 text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                  title="Đăng nhập tài khoản"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#DC2626] group-hover:text-white" />
                  <span className="hidden sm:inline">Đăng nhập</span>
                </Link>
              ) : (
                /* Trạng thái đã đăng nhập: Avatar + Tên + Dropdown */
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-lg border border-neutral-800 bg-neutral-900 hover:border-[#DC2626] transition-all cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#DC2626] text-white flex items-center justify-center font-bold text-[10px] shadow-xs">
                      {getUserInitials()}
                    </div>
                    <span className="hidden sm:inline text-xs font-semibold text-neutral-200 max-w-[110px] truncate">
                      {user?.fullName || user?.email?.split('@')[0] || 'Tài khoản'}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu Phân Quyền */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#141414] border border-neutral-800 shadow-xl shadow-black/60 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      {/* User Info Header */}
                      <div className="px-4 py-2.5 border-b border-neutral-800">
                        <p className="text-xs font-bold text-white truncate">
                          {user?.fullName || 'Khách hàng'}
                        </p>
                        <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                          {user?.email}
                        </p>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          {isAdmin ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-950/80 border border-red-500/50 text-[10px] font-black text-[#DC2626] uppercase font-mono">
                              <ShieldAlert className="w-3 h-3" />
                              Quản trị viên
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-neutral-800 text-[10px] font-semibold text-neutral-300 uppercase font-mono">
                              Hội viên NewMos
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Menu Links */}
                      <div className="py-1">
                        <Link
                          to="/my-orders"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-neutral-200 hover:text-white hover:bg-neutral-800/80 transition-colors"
                        >
                          <Package className="w-4 h-4 text-red-500" />
                          <span>Đơn hàng của tôi</span>
                        </Link>

                        <Link
                          to="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-neutral-200 hover:text-white hover:bg-neutral-800/80 transition-colors"
                        >
                          <User className="w-4 h-4 text-neutral-400" />
                          <span>Thông tin tài khoản</span>
                        </Link>

                        <Link
                          to="/profile?tab=ai-fit"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-neutral-200 hover:text-white hover:bg-neutral-800/80 transition-colors"
                        >
                          <Sparkles className="w-4 h-4 text-red-400" />
                          <span>Hồ sơ đo chân AI Fit</span>
                        </Link>

                        {/* Trang Quản Trị: Chỉ hiển thị khi có quyền ROLE_ADMIN */}
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors"
                          >
                            <ShieldAlert className="w-4 h-4 text-[#DC2626]" />
                            <span>Trang quản trị (Admin)</span>
                          </Link>
                        )}
                      </div>

                      {/* Đăng Xuất Button */}
                      <div className="pt-1 border-t border-neutral-800">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-950/20 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Hamburger Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#0A0A0A] border-b border-neutral-800 px-4 py-4 space-y-3 animate-in slide-in-from-top duration-200">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm giày, mẫu mã..."
              className="w-full pl-9 pr-9 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-red-500"
            />
            <button
              type="button"
              onClick={handleOpenVisualSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-red-500"
            >
              <Camera className="w-4 h-4" />
            </button>
          </form>

          {/* User Status on Mobile */}
          <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#DC2626] text-white flex items-center justify-center font-bold text-xs">
                      {getUserInitials()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white leading-tight">
                        {user?.fullName || 'Người dùng'}
                      </p>
                      <p className="text-[10px] text-neutral-400 leading-tight">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  {isAdmin && (
                    <span className="px-1.5 py-0.5 rounded bg-red-950 border border-red-500/40 text-[9px] font-mono text-red-400">
                      ADMIN
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-neutral-800 flex flex-col gap-1.5">
                  <Link
                    to="/my-orders"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-xs text-neutral-300 hover:text-white flex items-center gap-2"
                  >
                    <Package className="w-3.5 h-3.5 text-red-500" />
                    <span>Đơn hàng của tôi</span>
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-xs text-neutral-300 hover:text-white flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Thông tin tài khoản</span>
                  </Link>
                  <Link
                    to="/profile?tab=ai-fit"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-xs text-neutral-300 hover:text-white flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-red-400" />
                    <span>Hồ sơ đo chân AI Fit</span>
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-xs text-red-400 font-bold"
                    >
                      Trang quản trị (Admin)
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-left text-xs text-red-500 font-bold pt-1"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/auth"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-md bg-[#DC2626] text-white text-xs font-bold uppercase tracking-wider"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập / Đăng ký</span>
              </Link>
            )}
          </div>

          <div className="space-y-1 pt-1">
            {navLinks.map((link) => {
              if (link.isAI) {
                return (
                  <button
                    key={link.name}
                    onClick={handleOpenAIFit}
                    className="w-full text-left py-2 px-3 rounded-lg text-xs font-bold text-red-500 uppercase flex items-center gap-2 bg-red-950/20 border border-red-500/20"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{link.name}</span>
                  </button>
                );
              }

              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 px-3 rounded-lg text-xs font-bold uppercase text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors"
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
