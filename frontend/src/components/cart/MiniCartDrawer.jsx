import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useCartStore } from '../../stores/useCartStore';
import { OrderDetailModal } from './OrderDetailModal';
import { formatCurrency } from '../../lib/utils';

export function MiniCartDrawer() {
  const navigate = useNavigate();
  const {
    cart: rawCart,
    items: rawItems,
    isOpen,
    setIsOpen,
    removeFromCart,
    updateQuantity,
    getTotalPrice,
    getTotalItems,
    clearCart,
  } = useCartStore();

  const cart = (rawCart && rawCart.length > 0) ? rawCart : (rawItems || []);

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const totalItems = getTotalItems();
  const rawTotalPrice = getTotalPrice();
  // Chuẩn hóa VND
  const totalPrice = rawTotalPrice < 10000 ? rawTotalPrice * 25000 : rawTotalPrice;

  const handleProceedToCheckout = () => {
    setIsOpen(false);
    navigate('/checkout');
  };

  const handleViewOrderDetail = () => {
    setIsOrderModalOpen(true);
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-300"
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <aside
              aria-label="GIỎ HÀNG NEWMOS"
              className="w-screen max-w-md bg-white border-l border-slate-300 text-slate-900 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 font-sans"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#0A0A0A] text-white flex items-center justify-center font-black">
                    <ShoppingBag className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">
                      GIỎ HÀNG CỦA BẠN
                    </h3>
                    <div className="text-[10px] font-mono text-slate-500">
                      HỆ THỐNG GIAO HÀNG TỰ ĐỘNG
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-[11px] font-bold text-slate-500 hover:text-red-600 px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                    >
                      Xóa tất cả
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="Đóng"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 divide-y divide-slate-100">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-black uppercase text-slate-900">
                        GIỎ HÀNG ĐANG TRỐNG
                      </p>
                      <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                        Bạn chưa chọn đôi giày nào. Hãy khám phá ngay các mẫu giày hot nhất của chúng tôi.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        navigate('/shop');
                      }}
                      className="mt-2 px-5 py-2.5 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-red-600/20"
                    >
                      KHÁM PHÁ SẢN PHẨM NGAY
                    </button>
                  </div>
                ) : (
                  cart.map((item) => {
                    const itemPrice = item.price < 10000 ? item.price * 25000 : item.price;
                    return (
                      <div
                        key={`${item.id}-size-${item.size}`}
                        className="pt-4 first:pt-0 flex gap-4 items-center group"
                      >
                        {/* Thumbnail */}
                        <div className="relative w-20 h-20 rounded-lg bg-slate-50 border border-slate-200 p-2 overflow-hidden shrink-0 flex items-center justify-center">
                          <img
                            src={
                              item.image ||
                              'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80'
                            }
                            alt={item.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                          />
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded-xs bg-[#0A0A0A] text-[9px] font-mono font-bold text-white">
                            {item.size}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-black uppercase text-slate-900 truncate group-hover:text-red-600 transition-colors">
                              {item.name}
                            </h4>
                            <button
                              onClick={() => removeFromCart(item.id, item.size)}
                              className="text-slate-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                              title="Xóa khỏi giỏ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <p className="text-[11px] text-slate-500 truncate">
                            {item.color || item.brand}
                          </p>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-sm font-black font-mono text-red-600">
                              {formatCurrency(itemPrice)}
                            </span>

                            {/* Quantity +/- */}
                            <div className="flex items-center border border-slate-300 rounded-lg bg-slate-50">
                              <button
                                onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                                className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-black font-bold cursor-pointer"
                                aria-label="Giảm"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-7 text-center font-mono font-bold text-xs text-slate-900">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                                className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-black font-bold cursor-pointer"
                                aria-label="Tăng"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer Checkout CTA */}
              {cart.length > 0 && (
                <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-4">
                  <div className="space-y-2 text-xs font-sans">
                    <div className="flex justify-between text-slate-500">
                      <span>Tạm tính ({totalItems} sản phẩm):</span>
                      <span className="text-slate-900 font-bold font-mono">
                        {formatCurrency(totalPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-red-600" />
                        Giao hàng tiêu chuẩn:
                      </span>
                      <span className="text-emerald-600 font-bold uppercase">
                        {totalPrice >= 1000000 ? 'MIỄN PHÍ' : '30.000 ₫'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                      <span className="font-black text-slate-900 uppercase">
                        TỔNG THANH TOÁN:
                      </span>
                      <span className="text-lg font-black text-red-600 font-mono">
                        {formatCurrency(totalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Primary Checkout CTA */}
                  <div className="space-y-2">
                    <button
                      onClick={handleProceedToCheckout}
                      className="w-full py-3.5 px-6 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs uppercase tracking-wider shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 group"
                    >
                      <span>TIẾN HÀNH THANH TOÁN</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          navigate('/cart');
                        }}
                        className="w-full py-2 px-3 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer text-center"
                      >
                        Xem Giỏ Hàng
                      </button>
                      <button
                        onClick={handleViewOrderDetail}
                        className="w-full py-2 px-3 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer text-center"
                      >
                        Xem Hóa Đơn
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 text-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>CHÍNH HÃNG 100% • ĐỔI TRẢ 30 NGÀY MIỄN PHÍ</span>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
      />
    </>
  );
}

export default MiniCartDrawer;
