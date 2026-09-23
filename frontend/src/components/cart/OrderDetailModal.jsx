import { useState } from 'react';
import {
  X,
  Truck,
  CheckCircle2,
  ArrowRight,
  CreditCard,
  QrCode,
  Lock,
  Cpu,
  Printer,
} from 'lucide-react';
import { useCartStore } from '../../stores/useCartStore';
import { formatCurrency, cn } from '../../lib/utils';

export function OrderDetailModal({ isOpen, onClose }) {
  const {
    cart: rawCart,
    items: rawItems,
    getTotalPrice,
    getTotalItems,
    clearCart,
  } = useCartStore();
  const cart = (rawCart && rawCart.length > 0) ? rawCart : (rawItems || []);

  const [step, setStep] = useState('review'); // 'review' | 'confirmed'
  const [paymentMethod, setPaymentMethod] = useState('qr'); // 'qr' | 'card' | 'cod'
  const [formData, setFormData] = useState({
    name: 'Nguyễn Tuấn Anh',
    phone: '0988 123 456',
    address: '123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    notes: 'Kiểm tra hộp và tem xác thực khi nhận hàng.',
  });

  if (!isOpen) return null;

  const totalItems = getTotalItems();
  const rawTotalPrice = getTotalPrice();
  const totalPrice = rawTotalPrice < 10000 ? rawTotalPrice * 25000 : rawTotalPrice;

  const handleConfirmOrder = (e) => {
    e.preventDefault();
    setStep('confirmed');
  };

  const handleFinish = () => {
    clearCart();
    setStep('review');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
      {/* Backdrop */}
      <div
        onClick={step === 'confirmed' ? handleFinish : onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-6">
        <div className="relative w-full max-w-3xl bg-white border border-slate-300 rounded-2xl p-6 sm:p-8 shadow-2xl text-slate-900 space-y-6 animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-black text-white flex items-center justify-center shadow-md">
                <Cpu className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black uppercase tracking-tight text-slate-950">
                    CHI TIẾT HÓA ĐƠN & ĐƠN HÀNG
                  </h3>
                  <span className="px-2 py-0.5 rounded-xs bg-red-600 text-white text-[9px] font-mono font-black">
                    TIÊU CHUẨN V2.4
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-slate-500 mt-0.5">
                  <span>HỆ THỐNG XÁC THỰC AI FIT</span>
                  <span>//</span>
                  <span className="text-red-600 font-bold">MÃ LÔ #NEWMOS-88410</span>
                </div>
              </div>
            </div>

            <button
              onClick={step === 'confirmed' ? handleFinish : onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {step === 'review' ? (
            /* Review & Fill Order Information */
            <form onSubmit={handleConfirmOrder} className="space-y-6">
              {/* 1. Ordered Items Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
                  <span>01 // DANH SÁCH SẢN PHẨM ({totalItems})</span>
                  <span className="text-red-600">BẢO HIỂM CHÍNH HÃNG</span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                  {cart.map((item) => {
                    const itemPrice = item.price < 10000 ? item.price * 25000 : item.price;
                    return (
                      <div
                        key={`${item.id}-size-${item.size}`}
                        className="pt-2 first:pt-0 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80'}
                            alt={item.name}
                            className="w-12 h-12 rounded-md object-contain bg-slate-50 border border-slate-200 p-1"
                          />
                          <div>
                            <h4 className="text-xs font-black uppercase text-slate-900">
                              {item.name}
                            </h4>
                            <div className="text-[11px] font-mono text-slate-500 flex items-center gap-2">
                              <span>SIZE: {item.size} EU</span>
                              <span>•</span>
                              <span>SL: {item.quantity}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <div className="text-xs font-black text-slate-900">
                            {formatCurrency(itemPrice * item.quantity)}
                          </div>
                          <span className="text-[10px] text-emerald-600 font-bold">CHUẨN SIZE NEWMOS</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Delivery Information */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
                  02 // THÔNG TIN GIAO HÀNG
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-600 font-bold uppercase mb-1">
                      HỌ VÀ TÊN NGƯỜI NHẬN
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 font-bold uppercase mb-1">
                      SỐ ĐIỆN THOẠI LIÊN HỆ
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-red-600 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-600 font-bold uppercase mb-1">
                      ĐỊA CHỈ NHẬN HÀNG CHI TIẾT
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Settlement Protocol (Payment) */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
                  <span>03 // PHƯƠNG THỨC THANH TOÁN</span>
                  <span className="text-emerald-600 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> BẢO MẬT SSL 256-BIT
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'qr', name: 'QUÉT MÃ VIETQR', icon: QrCode },
                    { id: 'card', name: 'THẺ QUỐC TẾ (VISA/MASTER)', icon: CreditCard },
                    { id: 'cod', name: 'TIỀN MẶT KHI NHẬN HÀNG', icon: Truck },
                  ].map((p) => {
                    const isSelected = paymentMethod === p.id;
                    const IconComp = p.icon;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPaymentMethod(p.id)}
                        className={cn(
                          'p-3 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5',
                          isSelected
                            ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-md'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400'
                        )}
                      >
                        <IconComp className={cn('w-4 h-4', isSelected ? 'text-red-500' : 'text-slate-500')} />
                        <span className="text-[10px] font-bold tracking-wider uppercase">
                          {p.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Financial Breakdown & CTA */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs font-sans">
                <div className="flex justify-between text-slate-600">
                  <span>Tạm tính tiền hàng:</span>
                  <span className="text-slate-900 font-bold font-mono">{formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Phí vận chuyển giao nhanh:</span>
                  <span className="text-emerald-600 font-bold uppercase">
                    {totalPrice >= 1000000 ? 'MIỄN PHÍ' : '30.000 ₫'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Bảo hiểm & chip xác thực NFC:</span>
                  <span className="text-slate-900 font-bold">0 ₫ (ĐÃ BAO GỒM)</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                  <span className="font-black text-slate-900 uppercase">TỔNG THANH TOÁN:</span>
                  <span className="text-xl font-black text-red-600 font-mono">{formatCurrency(totalPrice)}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                className="w-full py-4 px-6 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-red-600/30 transition-all cursor-pointer active:scale-98"
              >
                <span>XÁC NHẬN ĐẶT HÀNG // {formatCurrency(totalPrice)}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Order Confirmed / Telemetry Dispatch Tracking */
            <div className="space-y-6 text-center py-6">
              <div className="w-16 h-16 rounded-2xl bg-red-600 text-white mx-auto flex items-center justify-center shadow-xl shadow-red-600/40">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-red-600">
                  ĐÃ XÁC NHẬN ĐƠN HÀNG THÀNH CÔNG
                </span>
                <h2 className="text-2xl font-black uppercase text-slate-950">
                  MÃ ĐƠN HÀNG #NEWMOS-88410
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Sản phẩm của bạn đã được xuất kho tự động và gán chip xác thực NFC chính hãng đồng bộ với hồ sơ AI Fit.
                </p>
              </div>

              {/* Tracking Timeline */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 text-left space-y-3 font-sans text-xs max-w-lg mx-auto">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 font-mono">
                  <span className="font-bold text-slate-700 uppercase">TIẾN TRÌNH VẬN ĐƠN:</span>
                  <span className="text-emerald-600 font-bold">100% HOÀN TẤT</span>
                </div>

                <div className="space-y-2 text-[11px]">
                  <div className="flex items-center gap-2 text-slate-900 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>01 // Xuất kho tự động & kiểm định: HOÀN TẤT</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-900 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>02 // Mã hóa chip NFC đế giày: ĐÃ XÁC THỰC</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-900 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>03 // Đóng gói & bàn giao đơn vị vận chuyển: ĐANG GIAO (DỰ KIẾN 2H)</span>
                  </div>
                </div>
              </div>

              {/* QR Code / Receipt Voucher */}
              <div className="p-4 bg-[#0A0A0A] text-white rounded-xl max-w-sm mx-auto flex items-center justify-between border border-neutral-800 font-mono text-xs">
                <div className="text-left space-y-0.5">
                  <div className="text-[10px] text-neutral-400 font-bold uppercase">
                    MÃ XÁC THỰC HÓA ĐƠN
                  </div>
                  <div className="text-red-400 font-bold text-xs">0x88FA...C091</div>
                  <div className="text-[10px] text-neutral-400">Tổng: {formatCurrency(totalPrice)}</div>
                </div>
                <div className="w-12 h-12 bg-white p-1 rounded-lg flex items-center justify-center">
                  <QrCode className="w-10 h-10 text-black" />
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>IN HÓA ĐƠN</span>
                </button>
                <button
                  onClick={handleFinish}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                >
                  QUAY LẠI CỬA HÀNG
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderDetailModal;
