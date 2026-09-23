import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  Tag,
  CheckCircle2,
  ChevronRight,
  Flame,
  ArrowLeft,
} from 'lucide-react';
import { useCartStore } from '../stores/useCartStore';
import { useAIStore } from '../stores/useAIStore';
import { productService } from '../services/productService';
import { formatCurrency } from '../lib/utils';

export function CartPage() {
  const navigate = useNavigate();
  const {
    cart: rawCart,
    items: rawItems,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
  } = useCartStore();
  const cart = (rawCart && rawCart.length > 0) ? rawCart : (rawItems || []);
  const { recommendedSize } = useAIStore();

  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [suggestedProducts, setSuggestedProducts] = useState([]);

  // Tải sản phẩm đề xuất từ Database
  useEffect(() => {
    const normalize = (p) => ({
      id: p.id,
      name: p.name,
      brand: p.brandName || p.brand || 'NewMos',
      category: p.categoryName || p.category || 'SNEAKER',
      price: p.minPrice ? Number(p.minPrice) : (p.price || 0),
      image: p.defaultThumbnail || p.image || p.variants?.[0]?.thumbnailUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80',
    });

    productService.getFeaturedProducts()
      .then((res) => {
        const list = res?.data || (Array.isArray(res) ? res : []);
        if (list.length > 0) {
          setSuggestedProducts(list.slice(0, 4).map(normalize));
        } else {
          productService.getAllProducts({ pageSize: 4 }).then((allRes) => {
            const allList = allRes?.data?.content || allRes?.data || [];
            setSuggestedProducts(allList.slice(0, 4).map(normalize));
          });
        }
      })
      .catch(() => {
        productService.getAllProducts({ pageSize: 4 }).then((allRes) => {
          const allList = allRes?.data?.content || allRes?.data || [];
          setSuggestedProducts(allList.slice(0, 4).map(normalize));
        }).catch(() => {});
      });
  }, []);

  const totalItems = getTotalItems();
  const rawSubtotal = getTotalPrice();
  const subtotal = rawSubtotal < 10000 ? rawSubtotal * 25000 : rawSubtotal;

  const FREE_SHIPPING_THRESHOLD = 1000000;
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const shippingProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  const shippingFee = subtotal === 0 || isFreeShipping ? 0 : 30000;
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    const code = couponCode.trim().toUpperCase();

    if (!code) {
      setCouponError('Vui lòng nhập mã ưu đãi!');
      return;
    }

    if (code === 'NEWMOS200' || code === 'KICKS200') {
      if (subtotal < 1500000) {
        setCouponError('Mã NEWMOS200 áp dụng cho đơn hàng từ 1.500.000 ₫');
        return;
      }
      setDiscountAmount(200000);
      setAppliedCoupon('NEWMOS200 (Giảm 200.000 ₫)');
      setCouponCode('');
    } else if (code === 'AIFIT') {
      setDiscountAmount(150000);
      setAppliedCoupon('AIFIT (Giảm 150.000 ₫)');
      setCouponCode('');
    } else if (code === 'FREESHIP') {
      setDiscountAmount(30000);
      setAppliedCoupon('FREESHIP (Miễn phí ship)');
      setCouponCode('');
    } else {
      setCouponError('Mã giảm giá không tồn tại. Thử: NEWMOS200 hoặc AIFIT');
    }
  };

  const handleRemoveCoupon = () => {
    setDiscountAmount(0);
    setAppliedCoupon('');
    setCouponError('');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 1. Breadcrumb điều hướng */}
        <nav className="flex items-center gap-2 text-xs text-neutral-500 mb-6 font-sans">
          <Link to="/" className="hover:text-[#DC2626] transition-colors">
            Trang chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/shop" className="hover:text-[#DC2626] transition-colors">
            Sản phẩm
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#0A0A0A] font-bold">Giỏ hàng ({totalItems})</span>
        </nav>

        {/* 2. Tiêu đề trang */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black uppercase text-[#0A0A0A] tracking-tight">
                Giỏ Hàng Của Bạn
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#DC2626] text-white text-xs font-bold font-mono">
                {totalItems} MÓN
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1 font-sans">
              Kiểm tra kỹ kích thước giày và thông tin trước khi tiến hành thanh toán
            </p>
          </div>

          {cart.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ sản phẩm trong giỏ hàng?')) {
                  clearCart();
                }
              }}
              className="self-start sm:self-auto text-xs font-bold text-neutral-500 hover:text-[#DC2626] flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 hover:border-red-200 bg-white transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa toàn bộ giỏ</span>
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          /* TRƯỜNG HỢP GIỎ HÀNG TRỐNG */
          <div className="space-y-12">
            <div className="bg-white rounded-xl border border-neutral-200 p-8 sm:p-14 text-center max-w-2xl mx-auto shadow-sm">
              <div className="w-20 h-20 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto mb-5 text-neutral-400">
                <ShoppingBag className="w-10 h-10" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0A0A0A] uppercase">
                Giỏ Hàng Đang Trống
              </h2>
              <p className="text-sm text-neutral-500 max-w-md mx-auto mt-2 leading-relaxed">
                Bạn chưa thêm đôi giày nào vào giỏ. Hãy khám phá ngay bộ sưu tập giày thể thao mới nhất tích hợp công nghệ đo size AI chuẩn xác!
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/shop"
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-red-600/20 flex items-center justify-center gap-2"
                >
                  <Flame className="w-4 h-4" />
                  <span>Khám Phá Sản Phẩm Ngay</span>
                </Link>
                <Link
                  to="/ai-fit"
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#0A0A0A] hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-red-400" />
                  <span>Trải Nghiệm Đo Size AI</span>
                </Link>
              </div>
            </div>

            {/* Gợi ý sản phẩm thịnh hành */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-[11px] font-mono font-bold text-[#DC2626] uppercase tracking-wider">
                    GỢI Ý TỪ PHÒNG LAB NEWMOS
                  </span>
                  <h3 className="text-xl font-black text-[#0A0A0A] uppercase mt-0.5">
                    Có Thể Bạn Sẽ Thích
                  </h3>
                </div>
                <Link
                  to="/shop"
                  className="text-xs font-bold text-[#DC2626] hover:underline flex items-center gap-1"
                >
                  <span>Xem tất cả</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {suggestedProducts.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="group bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="relative aspect-square bg-neutral-50 p-4 flex items-center justify-center overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded-sm bg-[#0A0A0A] text-white text-[10px] font-mono font-bold uppercase">
                        {product.brand}
                      </span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-[#DC2626] font-semibold uppercase">
                          {product.category}
                        </span>
                        <h4 className="text-sm font-bold text-[#0A0A0A] group-hover:text-[#DC2626] transition-colors line-clamp-1 mt-0.5">
                          {product.name}
                        </h4>
                      </div>
                      <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between">
                        <span className="text-sm font-black text-[#0A0A0A] font-mono">
                          {formatCurrency(product.price)}
                        </span>
                        <span className="text-xs font-bold text-[#DC2626] group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                          Chi tiết &rarr;
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* TRƯỜNG HỢP CÓ SẢN PHẨM TRONG GIỎ HÀNG */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Cột Trái: Danh sách sản phẩm & Thanh Freeship (8 cột) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Thanh tiến độ Miễn phí vận chuyển */}
              <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-red-50 text-[#DC2626] flex items-center justify-center shrink-0">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      {isFreeShipping ? (
                        <p className="text-xs sm:text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          Chúc mừng! Đơn hàng của bạn được MIỄN PHÍ VẬN CHUYỂN toàn quốc.
                        </p>
                      ) : (
                        <p className="text-xs sm:text-sm font-semibold text-neutral-800">
                          Mua thêm{' '}
                          <span className="text-[#DC2626] font-bold font-mono">
                            {formatCurrency(shippingRemaining)}
                          </span>{' '}
                          để nhận <span className="font-bold text-emerald-600">MIỄN PHÍ VẬN CHUYỂN</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-neutral-500 shrink-0">
                    {shippingProgress}%
                  </span>
                </div>

                {/* Progress bar line */}
                <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isFreeShipping
                        ? 'bg-emerald-500'
                        : 'bg-gradient-to-r from-red-500 to-[#DC2626]'
                    }`}
                    style={{ width: `${shippingProgress}%` }}
                  />
                </div>
              </div>

              {/* Danh sách Item Giỏ hàng */}
              <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs divide-y divide-neutral-200">
                {/* Header bảng trên desktop */}
                <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3.5 bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  <div className="col-span-6">Sản phẩm</div>
                  <div className="col-span-2 text-center">Đơn giá</div>
                  <div className="col-span-2 text-center">Số lượng</div>
                  <div className="col-span-2 text-right">Thành tiền</div>
                </div>

                {/* Danh sách các dòng sản phẩm */}
                {cart.map((item) => {
                  const itemPrice = item.price < 10000 ? item.price * 25000 : item.price;
                  const lineTotal = itemPrice * item.quantity;

                  return (
                    <div
                      key={`${item.id}-size-${item.size}`}
                      className="p-4 sm:p-6 flex flex-col sm:grid sm:grid-cols-12 gap-4 items-center group"
                    >
                      {/* Cột 1: Thông tin sản phẩm & Ảnh (6 cols) */}
                      <div className="w-full sm:col-span-6 flex items-center gap-4">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-neutral-50 border border-neutral-200 p-2 shrink-0 flex items-center justify-center overflow-hidden">
                          <img
                            src={
                              item.image ||
                              'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80'
                            }
                            alt={item.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                          />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <span className="text-[10px] font-mono font-bold text-[#DC2626] uppercase">
                            {item.brand || 'CHÍNH HÃNG'}
                          </span>
                          <Link
                            to={`/product/${item.id}`}
                            className="block text-sm font-bold text-[#0A0A0A] hover:text-[#DC2626] transition-colors truncate"
                          >
                            {item.name}
                          </Link>

                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-sm bg-neutral-100 text-neutral-800 text-xs font-mono font-bold border border-neutral-200">
                              Size: {item.size}
                            </span>
                            {recommendedSize && String(recommendedSize) === String(item.size) && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-red-50 text-[#DC2626] text-[10px] font-bold border border-red-200">
                                <Sparkles className="w-3 h-3" />
                                Chuẩn AI Fit
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => removeFromCart(item.id, item.size)}
                            className="text-xs font-semibold text-neutral-400 hover:text-[#DC2626] flex items-center gap-1 pt-1 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Xóa khỏi giỏ</span>
                          </button>
                        </div>
                      </div>

                      {/* Cột 2: Đơn giá (2 cols) */}
                      <div className="w-full sm:col-span-2 flex sm:flex-col justify-between sm:justify-center sm:text-center text-xs font-mono text-neutral-600">
                        <span className="sm:hidden font-sans font-semibold text-neutral-400">Đơn giá:</span>
                        <span className="font-bold">{formatCurrency(itemPrice)}</span>
                      </div>

                      {/* Cột 3: Bộ điều khiển số lượng (2 cols) */}
                      <div className="w-full sm:col-span-2 flex sm:justify-center items-center justify-between">
                        <span className="sm:hidden font-sans font-semibold text-xs text-neutral-400">Số lượng:</span>
                        <div className="flex items-center border border-neutral-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                          <button
                            onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
                            aria-label="Giảm"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-mono font-bold text-neutral-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
                            aria-label="Tăng"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Cột 4: Thành tiền (2 cols) */}
                      <div className="w-full sm:col-span-2 flex sm:flex-col justify-between sm:justify-center sm:text-right">
                        <span className="sm:hidden font-sans font-semibold text-xs text-neutral-400">Thành tiền:</span>
                        <span className="text-sm font-black font-mono text-[#DC2626]">
                          {formatCurrency(lineTotal)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Ghi chú đơn hàng & Tiếp tục mua sắm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-xs">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                    Ghi chú cho đơn hàng (Tùy chọn)
                  </label>
                  <textarea
                    rows={2}
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Ví dụ: Giao sau 18h, gọi trước khi giao, bọc hộp cẩn thận..."
                    className="w-full text-xs p-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#DC2626] font-sans resize-none"
                  />
                </div>

                <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-xs flex flex-col justify-center items-start gap-2">
                  <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                    Cần bổ sung thêm mẫu giày khác?
                  </span>
                  <p className="text-xs text-neutral-500">
                    Bạn vẫn có thể tiếp tục xem và thêm sản phẩm vào giỏ hàng bất cứ lúc nào.
                  </p>
                  <Link
                    to="/shop"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#DC2626] hover:underline pt-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Tiếp tục chọn thêm giày</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Cột Phải: Tóm tắt đơn hàng & Thanh toán (4 cột) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs space-y-6 sticky top-24">
                <h3 className="text-base font-black text-[#0A0A0A] uppercase tracking-wider border-b border-neutral-200 pb-3">
                  Tóm Tắt Đơn Hàng
                </h3>

                {/* Form Nhập Mã Khuyến Mãi */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                    Mã Giảm Giá / Voucher
                  </label>
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Mã: NEWMOS200 hoặc AIFIT"
                      className="flex-1 px-3 py-2 text-xs rounded-lg border border-neutral-200 focus:outline-none focus:border-[#DC2626] uppercase font-mono font-bold"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-[#0A0A0A] hover:bg-neutral-800 text-white text-xs font-bold uppercase transition-colors cursor-pointer"
                    >
                      Áp Dụng
                    </button>
                  </form>

                  {couponError && (
                    <p className="text-xs text-[#DC2626] mt-1.5 font-medium">{couponError}</p>
                  )}

                  {appliedCoupon && (
                    <div className="mt-2 p-2.5 rounded-lg bg-red-50 border border-red-200 flex items-center justify-between text-xs text-[#DC2626] font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 shrink-0" />
                        <span>{appliedCoupon}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-[11px] underline hover:text-red-800 cursor-pointer"
                      >
                        Gỡ
                      </button>
                    </div>
                  )}
                </div>

                {/* Chi tiết chi phí */}
                <div className="space-y-3 text-xs pt-3 border-t border-neutral-100 font-sans">
                  <div className="flex justify-between text-neutral-600">
                    <span>Tạm tính ({totalItems} đôi):</span>
                    <span className="font-mono font-bold text-neutral-900">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[#DC2626]">
                      <span>Giảm giá voucher:</span>
                      <span className="font-mono font-bold">
                        -{formatCurrency(discountAmount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-neutral-600">
                    <span className="flex items-center gap-1">
                      Phí vận chuyển:
                    </span>
                    <span className={`font-mono font-bold ${shippingFee === 0 ? 'text-emerald-600' : 'text-neutral-900'}`}>
                      {shippingFee === 0 ? 'MIỄN PHÍ' : formatCurrency(shippingFee)}
                    </span>
                  </div>

                  {/* Tổng cộng thanh toán */}
                  <div className="pt-4 border-t border-neutral-200 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block">
                        Tổng thanh toán:
                      </span>
                      <span className="text-[10px] text-neutral-400 font-sans">
                        (Đã bao gồm thuế VAT 8%)
                      </span>
                    </div>
                    <span className="text-xl font-black text-[#DC2626] font-mono">
                      {formatCurrency(finalTotal)}
                    </span>
                  </div>
                </div>

                {/* Nút CTA Thanh Toán */}
                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full py-3.5 px-6 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                >
                  <span>TIẾN HÀNH THANH TOÁN</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Cam kết dịch vụ NewMos */}
                <div className="pt-4 border-t border-neutral-100 space-y-2.5 text-[11px] text-neutral-500 font-sans">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Cam kết 100% hàng chính hãng Authentic</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-[#DC2626] shrink-0" />
                    <span>Đổi trả 30 ngày miễn phí nếu không vừa size</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-neutral-700 shrink-0" />
                    <span>Giao hàng hỏa tốc 2H nội thành Hà Nội & TP.HCM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CartPage;
