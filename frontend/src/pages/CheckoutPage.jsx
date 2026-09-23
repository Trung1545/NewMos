import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  ArrowLeft,
  Lock,
  Tag,
  Sparkles,
  ShoppingBag,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useCartStore } from '../stores/useCartStore';
import { orderService } from '../services/orderService';
import { productService } from '../services/productService';
import { Toast } from '../components/common/Toast';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cart: rawCart, items: rawItems, getTotalPrice, clearCart } = useCartStore();
  const items = (rawItems && rawItems.length > 0) ? rawItems : (rawCart || []);

  const [paymentMethod, setPaymentMethod] = useState('vietqr');
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toast, setToast] = useState(null);

  // Customer Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: 'Hồ Chí Minh',
    notes: '',
  });

  const rawSubtotal = getTotalPrice();
  const subtotal = rawSubtotal < 10000 ? rawSubtotal * 25000 : rawSubtotal;
  const shippingFee = subtotal >= 1000000 || subtotal === 0 ? 0 : shippingMethod === 'express' ? 50000 : 30000;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleApplyPromo = (e) => {
    e.preventDefault();
    const codeUpper = promoCode.trim().toUpperCase();
    if (codeUpper === 'NEWMOS200' || codeUpper === 'KICKS200') {
      setDiscountAmount(200000);
      setPromoApplied(true);
      setToast({
        title: 'ÁP DỤNG THÀNH CÔNG',
        message: `Mã ưu đãi ${codeUpper} được kích hoạt! Giảm ngay 200.000 ₫ vào tổng đơn.`,
        isError: false,
      });
    } else if (codeUpper === 'AIFIT') {
      setDiscountAmount(150000);
      setPromoApplied(true);
      setToast({
        title: 'ÁP DỤNG THÀNH CÔNG',
        message: 'Mã ưu đãi AI Fit được kích hoạt! Giảm ngay 150.000 ₫ vào tổng đơn.',
        isError: false,
      });
    } else {
      setToast({
        title: 'MÃ ƯU ĐÃI KHÔNG HỢP LỆ',
        message: 'Mã ưu đãi không tồn tại hoặc đã hết hạn. Hãy thử: NEWMOS200 hoặc AIFIT',
        isError: true,
      });
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (items.length === 0) {
      const msg = 'Giỏ hàng của bạn đang trống! Vui lòng chọn sản phẩm vào giỏ trước khi thanh toán.';
      setErrorMessage(msg);
      setToast({ title: 'GIỎ HÀNG TRỐNG', message: msg, isError: true });
      return;
    }

    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.address.trim()) {
      const msg = 'Vui lòng điền đầy đủ Họ và tên, Số điện thoại và Địa chỉ giao hàng!';
      setErrorMessage(msg);
      setToast({ title: 'THIẾU THÔNG TIN', message: msg, isError: true });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Phân giải variantId cho từng item trong giỏ
      const orderItems = [];
      for (const item of items) {
        let vId = item.variantId;
        if (!vId && item.id) {
          try {
            const pRes = await productService.getProductById(item.id);
            const pData = pRes?.data || pRes;
            const matched =
              pData?.variants?.find((v) => String(v.sizeEu) === String(item.size)) ||
              pData?.variants?.[0];
            if (matched) vId = matched.id;
          } catch {
            // Không tìm thấy sản phẩm
          }
        }
        if (vId) {
          orderItems.push({
            variantId: Number(vId),
            quantity: item.quantity || 1,
          });
        }
      }

      if (orderItems.length === 0) {
        const msg = 'Không thể xác thực biến thể sản phẩm trong kho. Vui lòng chọn lại kích cỡ sản phẩm!';
        setErrorMessage(msg);
        setToast({ title: 'LỖI SẢN PHẨM', message: msg, isError: true });
        setIsSubmitting(false);
        return;
      }

      // 2. Chuẩn bị payload chuẩn theo Backend CreateOrderRequest
      const paymentEnum =
        paymentMethod === 'cod'
          ? 'COD'
          : paymentMethod === 'card'
          ? 'CREDIT_CARD'
          : 'VIETQR';

      const payload = {
        customerName: formData.fullName.trim(),
        recipientName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        recipientPhone: formData.phone.trim(),
        recipientEmail: formData.email?.trim() || undefined,
        shippingAddress: formData.address.trim(),
        provinceCity: formData.city || 'Hồ Chí Minh',
        note: formData.notes?.trim() || undefined,
        orderNotes: formData.notes?.trim() || undefined,
        shippingMethod: shippingMethod === 'express' ? 'EXPRESS' : 'STANDARD',
        paymentMethod: paymentEnum,
        couponCode: promoApplied ? promoCode.trim().toUpperCase() : undefined,
        items: orderItems,
      };

      const res = await orderService.createOrder(payload);
      const createdOrder = res?.data || res;
      const orderCode = createdOrder?.orderCode || `NM-${createdOrder?.id || Math.floor(100000 + Math.random() * 900000)}`;
      const currentItems = [...items];

      // Dọn sạch giỏ hàng & chuyển sang trang xác nhận thành công kèm mã đơn
      clearCart();
      navigate(`/order-success?code=${encodeURIComponent(orderCode)}`, {
        state: {
          orderCode,
          orderId: orderCode,
          orderData: createdOrder,
          formData,
          paymentMethod,
          shippingMethod,
          grandTotal: createdOrder?.totalAmount || grandTotal,
          items: currentItems,
        },
      });
    } catch (err) {
      console.error('Lỗi khi tạo đơn hàng:', err);
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Có lỗi xảy ra khi tạo đơn hàng hoặc sản phẩm đã hết hàng. Vui lòng kiểm tra lại!';
      setErrorMessage(errMsg);
      setToast({
        title: 'ĐẶT HÀNG THẤT BẠI',
        message: errMsg,
        isError: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#F9FAFB]">
        <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-8 text-center shadow-lg space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-50 text-[#DC2626] mx-auto flex items-center justify-center border-2 border-red-200">
            <CheckCircle2 className="w-10 h-10 text-[#DC2626]" />
          </div>

          <div>
            <span className="text-xs font-mono font-bold text-[#DC2626] uppercase tracking-wider">
              ĐÃ XÁC NHẬN ĐƠN HÀNG // #ORD-{Math.floor(100000 + Math.random() * 900000)}
            </span>
            <h1 className="text-2xl font-black text-[#0A0A0A] uppercase mt-1">
              Đặt Hàng Thành Công!
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Cảm ơn <span className="font-bold text-[#0A0A0A]">{formData.fullName}</span>. Hệ thống đã xác nhận đơn hàng và gửi email chi tiết đến <span className="font-semibold">{formData.email || 'email của bạn'}</span>.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg text-left text-xs space-y-2 border border-slate-100 font-sans">
            <div className="flex justify-between">
              <span className="text-slate-500">Phương thức thanh toán:</span>
              <span className="font-bold text-[#0A0A0A]">
                {paymentMethod === 'vietqr'
                  ? 'Quét mã VietQR 24/7'
                  : paymentMethod === 'cod'
                  ? 'Thanh toán tiền mặt (COD)'
                  : 'Thẻ quốc tế (Visa/Master)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Dự kiến giao hàng:</span>
              <span className="font-bold text-emerald-600">
                {shippingMethod === 'express' ? 'Hỏa tốc trong 2 giờ' : '1 - 2 ngày làm việc'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tổng thanh toán:</span>
              <span className="font-black text-[#DC2626] font-mono">
                {grandTotal.toLocaleString('vi-VN')} ₫
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Link
              to="/profile"
              className="w-full py-3 rounded-lg bg-[#0A0A0A] hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider transition-colors text-center"
            >
              Tra Cứu Đơn Hàng Tại Profile
            </Link>
            <Link
              to="/shop"
              className="w-full py-3 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider transition-colors text-center"
            >
              Tiếp Tục Mua Sắm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs text-slate-500">
          <Link to="/shop" className="hover:text-[#DC2626] flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Quay lại cửa hàng
          </Link>
          <span>/</span>
          <span className="text-[#0A0A0A] font-bold">Thanh Toán Đơn Hàng</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-[#0A0A0A] uppercase tracking-tight mb-8">
          Thanh Toán & Xác Nhận Đơn Hàng
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Cột Trái: Thông tin giao hàng & Phương thức thanh toán (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Khối 1: Thông tin người nhận */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-[#DC2626]/10 text-[#DC2626] flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#0A0A0A]">
                  Thông Tin Giao Hàng
                </h2>
              </div>

              <form className="mt-4 space-y-4 font-sans text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Họ và tên người nhận *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Số điện thoại liên hệ *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0912 345 678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Email nhận thông báo mã vận đơn
                  </label>
                  <input
                    type="email"
                    placeholder="example@newmos.vn"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 font-semibold mb-1">
                      Địa chỉ nhận hàng chi tiết *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Số nhà, tên đường, phường/xã..."
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Tỉnh / Thành phố
                    </label>
                    <select
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-[#DC2626] bg-white"
                    >
                      <option value="Hồ Chí Minh">TP. Hồ Chí Minh</option>
                      <option value="Hà Nội">Hà Nội</option>
                      <option value="Đà Nẵng">Đà Nẵng</option>
                      <option value="Cần Thơ">Cần Thơ</option>
                      <option value="Hải Phòng">Hải Phòng</option>
                      <option value="Khác">Tỉnh thành khác</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Ghi chú giao hàng (Tùy chọn)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#DC2626]"
                  />
                </div>
              </form>
            </div>

            {/* Khối 2: Phương thức vận chuyển */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-[#DC2626]/10 text-[#DC2626] flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#0A0A0A]">
                  Phương Thức Vận Chuyển
                </h2>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setShippingMethod('standard')}
                  className={`p-4 rounded-xl border-2 flex items-start justify-between cursor-pointer transition-all ${
                    shippingMethod === 'standard'
                      ? 'border-[#DC2626] bg-red-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Truck className={`w-5 h-5 mt-0.5 ${shippingMethod === 'standard' ? 'text-[#DC2626]' : 'text-slate-400'}`} />
                    <div>
                      <div className="text-xs font-bold text-[#0A0A0A]">Giao Tiêu Chuẩn</div>
                      <div className="text-[11px] text-slate-500">2 - 3 ngày làm việc</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold font-mono text-[#0A0A0A]">
                    {subtotal >= 1000000 ? 'MIỄN PHÍ' : '30.000₫'}
                  </span>
                </label>

                <label
                  onClick={() => setShippingMethod('express')}
                  className={`p-4 rounded-xl border-2 flex items-start justify-between cursor-pointer transition-all ${
                    shippingMethod === 'express'
                      ? 'border-[#DC2626] bg-red-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Clock className={`w-5 h-5 mt-0.5 ${shippingMethod === 'express' ? 'text-[#DC2626]' : 'text-slate-400'}`} />
                    <div>
                      <div className="text-xs font-bold text-[#0A0A0A]">Hỏa Tốc 2H (Nội thành)</div>
                      <div className="text-[11px] text-slate-500">Nhận hàng ngay hôm nay</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold font-mono text-[#0A0A0A]">
                    50.000₫
                  </span>
                </label>
              </div>
            </div>

            {/* Khối 3: Phương thức thanh toán */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-[#DC2626]/10 text-[#DC2626] flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#0A0A0A]">
                  Phương Thức Thanh Toán
                </h2>
              </div>

              <div className="mt-4 space-y-3">
                {/* VietQR Quick Scan */}
                <div
                  onClick={() => setPaymentMethod('vietqr')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'vietqr'
                      ? 'border-[#DC2626] bg-red-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <QrCode className="w-5 h-5 text-[#DC2626]" />
                      <div>
                        <div className="text-xs font-bold text-[#0A0A0A]">
                          Quét Mã VietQR (Chuyển khoản tức thì 24/7)
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Hỗ trợ tất cả ứng dụng ngân hàng và ví điện tử
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                      Khuyên Dùng
                    </span>
                  </div>

                  {paymentMethod === 'vietqr' && (
                    <div className="mt-4 pt-4 border-t border-red-100/60 flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-lg border border-slate-200">
                      <div className="w-28 h-28 bg-slate-900 rounded-lg p-2 flex items-center justify-center text-white text-center">
                        <QrCode className="w-20 h-20 text-white" />
                      </div>
                      <div className="text-xs space-y-1 text-slate-600">
                        <p className="font-bold text-[#0A0A0A]">Ngân hàng: MB BANK</p>
                        <p>Số tài khoản: <span className="font-mono font-bold text-[#DC2626]">0988889999</span></p>
                        <p>Chủ tài khoản: <span className="font-bold">NEWMOS JOINT STOCK</span></p>
                        <p className="text-[11px] text-slate-400">Nội dung: Mã đơn hàng tự động điền khi quét mã QR</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* COD Giao hàng thu tiền */}
                <div
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    paymentMethod === 'cod'
                      ? 'border-[#DC2626] bg-red-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Banknote className="w-5 h-5 text-slate-700" />
                    <div>
                      <div className="text-xs font-bold text-[#0A0A0A]">
                        Thanh toán khi nhận hàng (COD)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Kiểm tra hàng trước khi thanh toán tiền mặt cho bưu tá
                      </div>
                    </div>
                  </div>
                </div>

                {/* Thẻ Quốc tế Visa / Mastercard */}
                <div
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    paymentMethod === 'card'
                      ? 'border-[#DC2626] bg-red-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-slate-700" />
                    <div>
                      <div className="text-xs font-bold text-[#0A0A0A]">
                        Thẻ Tín Dụng / Ghi Nợ Quốc Tế
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Bảo mật SSL 256-bit chuẩn PCI-DSS (Visa, Mastercard, JCB)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cột Phải: Tóm tắt giỏ hàng & Đặt hàng (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs sticky top-24">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#0A0A0A] flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#DC2626]" />
                  Tóm Tắt Đơn Hàng ({items.length})
                </h2>
                <Link to="/shop" className="text-xs text-[#DC2626] font-semibold hover:underline">
                  Sửa
                </Link>
              </div>

              {/* Danh sách sản phẩm trong giỏ */}
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto my-3 pr-1">
                {items.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Giỏ hàng của bạn đang trống.
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={`${item.id}-${item.size}`} className="py-3 flex items-center gap-3">
                      <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-200 p-1 shrink-0 flex items-center justify-center">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-[#0A0A0A] truncate">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                          <span>Size: {item.size}</span>
                          <span>•</span>
                          <span>SL: {item.quantity}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-[#0A0A0A]">
                          {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* AI Verification Badge */}
              <div className="p-3 bg-red-50/60 rounded-lg border border-red-200/60 flex items-center gap-2.5 my-4">
                <Sparkles className="w-4 h-4 text-[#DC2626] shrink-0" />
                <span className="text-[11px] text-red-950 font-semibold leading-tight">
                  Tất cả sản phẩm được hỗ trợ tư vấn chọn size chuẩn xác từ NewMos AI.
                </span>
              </div>

              {/* Form Áp Dụng Mã Ưu Đãi */}
              <form onSubmit={handleApplyPromo} className="flex gap-2 my-4">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Mã voucher (Thử: NEWMOS200)"
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 uppercase font-mono focus:outline-none focus:border-[#DC2626]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0A0A0A] hover:bg-neutral-800 text-white rounded-lg text-xs font-bold uppercase transition-colors"
                >
                  Áp dụng
                </button>
              </form>

              {promoApplied && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold mb-3">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Áp dụng voucher giảm 200.000₫ thành công!</span>
                </div>
              )}

              {/* Bảng Chi Phí */}
              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs font-sans">
                <div className="flex justify-between text-slate-600">
                  <span>Tạm tính tiền hàng:</span>
                  <span className="font-mono font-bold text-[#0A0A0A]">
                    {subtotal.toLocaleString('vi-VN')}₫
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Phí vận chuyển:</span>
                  <span className="font-mono font-bold text-[#0A0A0A]">
                    {shippingFee === 0 ? 'MIỄN PHÍ' : `${shippingFee.toLocaleString('vi-VN')}₫`}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Giảm giá khuyến mãi:</span>
                    <span className="font-mono font-bold">
                      -{discountAmount.toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-sm font-black text-[#0A0A0A] uppercase">
                    Tổng Thanh Toán:
                  </span>
                  <span className="text-xl font-black font-mono text-[#DC2626]">
                    {grandTotal.toLocaleString('vi-VN')}₫
                  </span>
                </div>
              </div>

              {/* Alert lỗi màu đỏ nổi bật nếu đặt hàng thất bại */}
              {errorMessage && (
                <div className="mt-4 p-3.5 rounded-xl bg-red-50 border-2 border-red-500 text-red-700 flex items-start gap-2.5 animate-in fade-in duration-200">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-red-800">
                      Đặt hàng không thành công
                    </h4>
                    <p className="text-xs font-medium text-red-700 mt-0.5 leading-relaxed">
                      {errorMessage}
                    </p>
                  </div>
                  <button
                    onClick={() => setErrorMessage('')}
                    className="text-red-400 hover:text-red-700 p-0.5 cursor-pointer"
                    title="Đóng thông báo"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* CTA Đặt Hàng */}
              <button
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="w-full mt-6 py-3.5 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] disabled:bg-neutral-600 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>ĐANG XÁC NHẬN ĐƠN HÀNG...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>ĐẶT HÀNG NGAY</span>
                  </>
                )}
              </button>

              <div className="mt-3 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cam kết bảo mật thông tin & hoàn tiền 100% nếu phát hiện hàng giả</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast thông báo */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

export default CheckoutPage;
