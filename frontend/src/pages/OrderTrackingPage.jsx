import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { orderService } from '../services/orderService';

export function OrderTrackingPage() {
  const [searchParams] = useSearchParams();
  const initialOrderId = searchParams.get('code') || searchParams.get('orderId') || '';

  const [orderCode, setOrderCode] = useState(initialOrderId);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSearched, setIsSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [activeOrder, setActiveOrder] = useState(null);

  // Ánh xạ dữ liệu OrderResponse từ Backend sang UI format
  const mapOrderToUI = (dbOrder) => {
    const statusMap = {
      DELIVERED: 'delivered',
      SHIPPING: 'shipping',
      SHIPPED: 'shipping',
      CONFIRMED: 'processing',
      PROCESSING: 'processing',
      PENDING: 'pending',
      CANCELLED: 'cancelled',
    };
    const stepMap = {
      PENDING: 1,
      CONFIRMED: 2,
      PROCESSING: 2,
      SHIPPING: 3,
      SHIPPED: 3,
      DELIVERED: 4,
      CANCELLED: 0,
    };

    const statusKey = dbOrder.orderStatus || 'PENDING';
    const uiStatus = statusMap[statusKey] || 'pending';
    const currentStep = stepMap[statusKey] || 1;

    return {
      id: dbOrder.orderCode || `ORD-${dbOrder.id}`,
      date: dbOrder.createdAt ? new Date(dbOrder.createdAt).toLocaleString('vi-VN') : 'Vừa xong',
      customerName: dbOrder.recipientName || 'Khách Hàng NEWMOS',
      phone: dbOrder.recipientPhone || 'Chưa cung cấp',
      address: [dbOrder.shippingAddress, dbOrder.provinceCity].filter(Boolean).join(', ') || 'Địa chỉ giao hàng',
      courier: dbOrder.courierName || 'SPX Express Vietnam',
      trackingNumber: dbOrder.trackingNumber || `TRACK-${dbOrder.id || 'VN'}`,
      shipperPhone: '0912 345 678 (Bưu tá Hoàng)',
      status: uiStatus,
      currentStep: currentStep,
      estimatedDelivery: statusKey === 'DELIVERED' ? 'Đã giao thành công' : '1 - 2 ngày tới',
      total: dbOrder.totalAmount || 0,
      paymentMethod: `${dbOrder.paymentMethod || 'VIETQR'} (${dbOrder.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'})`,
      items: (dbOrder.items || []).map((it) => ({
        name: it.productName,
        brand: 'NEWMOS',
        size: it.size,
        price: it.unitPrice,
        quantity: it.quantity,
        image: it.productImage || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80',
      })),
      logs: [
        {
          time: dbOrder.createdAt ? new Date(dbOrder.createdAt).toLocaleString('vi-VN') : 'Vừa xong',
          title: 'Đã ghi nhận đơn hàng trên hệ thống',
          desc: `Đơn hàng ${dbOrder.orderCode || ''} đã được lưu thành công trên cơ sở dữ liệu.`,
          active: true,
        },
      ],
    };
  };

  // Tự động tìm kiếm nếu có query orderId từ URL
  useEffect(() => {
    if (initialOrderId) {
      handleSearch(initialOrderId);
    }
  }, [initialOrderId]);

  const handleSearch = async (codeToSearch = orderCode) => {
    setSearchError('');
    const cleanCode = (codeToSearch || '').trim().toUpperCase();

    if (!cleanCode) {
      setSearchError('Vui lòng nhập Mã đơn hàng để tra cứu!');
      return;
    }

    setIsLoading(true);
    try {
      let res;
      try {
        res = await orderService.trackOrder(cleanCode, phoneNumber.trim());
      } catch {
        res = await orderService.getOrderByCode(cleanCode);
      }

      const orderData = res?.data || res;
      if (orderData && (orderData.id || orderData.orderCode)) {
        setActiveOrder(mapOrderToUI(orderData));
        setIsSearched(true);
      } else {
        setActiveOrder(null);
        setSearchError(`Không tìm thấy đơn hàng "${cleanCode}" trong hệ thống cơ sở dữ liệu.`);
      }
    } catch (err) {
      console.error('Lỗi khi tra cứu đơn hàng:', err);
      setActiveOrder(null);
      setSearchError(`Không tìm thấy đơn hàng "${cleanCode}". Vui lòng kiểm tra lại mã đơn!`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (code) => {
    setOrderCode(code);
    handleSearch(code);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-neutral-500 font-sans">
          <Link to="/" className="hover:text-[#DC2626] transition-colors">
            Trang chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#0A0A0A] font-bold">Tra cứu đơn hàng</span>
        </nav>

        {/* 1. Header Tra Cứu */}
        <div className="bg-[#0A0A0A] text-white rounded-xl p-6 sm:p-10 relative overflow-hidden shadow-sm">
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-red-600/20 blur-2xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest block mb-1">
              DỊCH VỤ TRA CỨU BẬC CAO // LIVE TRACKING
            </span>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              Tra Cứu Đơn Hàng Nhanh
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-2 leading-relaxed">
              Theo dõi lộ trình vận chuyển bưu kiện giày thể thao theo thời gian thực mà không cần đăng nhập tài khoản.
            </p>

            {/* Form Tra Cứu */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="mt-6 flex flex-col sm:flex-row gap-3"
            >
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value)}
                  placeholder="Nhập mã đơn (Ví dụ: ORD-892411)..."
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs font-mono placeholder:text-neutral-500 focus:outline-none focus:border-[#DC2626] uppercase font-bold"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-red-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
              >
                <Truck className="w-4 h-4" />
                <span>Tra Cứu Ngay</span>
              </button>
            </form>

            {searchError && (
              <p className="text-xs text-red-400 mt-2 font-medium">{searchError}</p>
            )}

            {/* Hướng dẫn tra cứu */}
            <div className="mt-4 pt-4 border-t border-neutral-800/80 flex items-center gap-2 text-xs text-neutral-400">
              <span className="text-[11px] font-mono text-neutral-400">
                Gợi ý: Mã đơn hàng (ORD-XXXXXX) được gửi trong email xác nhận hoặc hiển thị ngay sau khi bạn đặt hàng thành công.
              </span>
            </div>
          </div>
        </div>

        {/* 2. Hiển thị kết quả tra cứu */}
        {isSearched && activeOrder && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Thanh thông tin tóm tắt & Trạng thái */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-black font-mono text-[#0A0A0A]">
                    {activeOrder.id}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-sans ${
                      activeOrder.status === 'delivered'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : activeOrder.status === 'shipping'
                        ? 'bg-amber-50 text-amber-600 border border-amber-200'
                        : 'bg-red-50 text-[#DC2626] border border-red-200'
                    }`}
                  >
                    {activeOrder.status === 'delivered'
                      ? '● Đã Giao Thành Công'
                      : activeOrder.status === 'shipping'
                      ? '● Đang Trên Đường Giao'
                      : '● Đang Xử Lý Tại Kho'}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1 font-sans">
                  Khởi tạo lúc: <span className="font-semibold text-neutral-800">{activeOrder.date}</span> • Đơn vị: <span className="font-semibold text-neutral-800">{activeOrder.courier}</span>
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[11px] uppercase tracking-wider text-neutral-500 block">
                  Dự Kiến Giao Hàng:
                </span>
                <span className="text-sm font-black text-[#DC2626]">
                  {activeOrder.estimatedDelivery}
                </span>
              </div>
            </div>

            {/* Stepper Timeline 4 Bước */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6 sm:p-8 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-6">
                Lộ Trình Xử Lý Đơn Hàng
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 relative">
                {[
                  { step: 1, title: 'Đã Tiếp Nhận', desc: 'Xác nhận đơn & thanh toán' },
                  { step: 2, title: 'Kiểm Định AI', desc: 'Check Authentic & Đóng gói' },
                  { step: 3, title: 'Đang Giao Hàng', desc: 'Bưu tá đang vận chuyển' },
                  { step: 4, title: 'Hoàn Tất', desc: 'Khách hàng ký nhận' },
                ].map((s) => {
                  const isPassed = activeOrder.currentStep >= s.step;
                  const isCurrent = activeOrder.currentStep === s.step;

                  return (
                    <div key={s.step} className="flex sm:flex-col items-start gap-3 relative">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-colors ${
                          isCurrent
                            ? 'bg-[#DC2626] text-white ring-4 ring-red-100 shadow-md shadow-red-600/30'
                            : isPassed
                            ? 'bg-neutral-900 text-white'
                            : 'bg-neutral-100 text-neutral-400 border border-neutral-200'
                        }`}
                      >
                        {isPassed && !isCurrent ? <CheckCircle2 className="w-5 h-5" /> : s.step}
                      </div>

                      <div>
                        <h4
                          className={`text-xs font-bold uppercase ${
                            isCurrent ? 'text-[#DC2626]' : isPassed ? 'text-[#0A0A0A]' : 'text-neutral-400'
                          }`}
                        >
                          {s.title}
                        </h4>
                        <p className="text-[11px] text-neutral-500 mt-0.5">{s.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chi tiết bưu tá & Lịch sử di chuyển */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Lịch sử nhật ký bưu kiện (7 cols) */}
              <div className="lg:col-span-7 bg-white rounded-xl border border-neutral-200 p-6 shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 border-b border-neutral-200 pb-3">
                  Nhật Ký Hành Trình Bưu Kiện
                </h3>

                <div className="space-y-4 pt-1">
                  {activeOrder.logs.map((log, index) => (
                    <div key={index} className="flex items-start gap-3.5 text-xs font-sans">
                      <div className="mt-1">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            log.active ? 'bg-[#DC2626] ring-4 ring-red-100' : 'bg-neutral-300'
                          }`}
                        />
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-bold ${
                              log.active ? 'text-[#DC2626]' : 'text-[#0A0A0A]'
                            }`}
                          >
                            {log.title}
                          </span>
                          <span className="text-[11px] font-mono text-neutral-400">
                            {log.time}
                          </span>
                        </div>
                        <p className="text-neutral-500 text-[11px] leading-relaxed">
                          {log.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Thông tin vận chuyển & Sản phẩm (5 cols) */}
              <div className="lg:col-span-5 bg-white rounded-xl border border-neutral-200 p-6 shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 border-b border-neutral-200 pb-3">
                  Chi Tiết Bưu Cục
                </h3>

                <div className="space-y-2.5 text-xs font-sans">
                  <div>
                    <span className="text-[11px] text-neutral-500 block">Mã vận đơn đối tác:</span>
                    <span className="font-mono font-bold text-neutral-900">{activeOrder.trackingNumber}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-neutral-500 block">Người nhận & Địa chỉ:</span>
                    <span className="font-semibold text-neutral-900">{activeOrder.customerName} ({activeOrder.phone})</span>
                    <p className="text-[11px] text-neutral-600 mt-0.5">{activeOrder.address}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-neutral-500 block">Liên hệ bưu tá:</span>
                    <span className="font-mono font-bold text-[#DC2626]">{activeOrder.shipperPhone}</span>
                  </div>
                </div>

                {/* Sản phẩm trong đơn */}
                <div className="pt-3 border-t border-neutral-200 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block">
                    Sản phẩm:
                  </span>
                  {activeOrder.items.map((prod, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 bg-neutral-50 rounded-lg">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-10 h-10 object-contain rounded bg-white border border-neutral-200 p-0.5"
                      />
                      <div className="flex-1 min-w-0 text-xs">
                        <p className="font-bold text-neutral-900 truncate">{prod.name}</p>
                        <p className="text-[11px] text-neutral-500">Size: {prod.size} • SL: {prod.quantity}</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#0A0A0A]">
                        {formatCurrency(prod.price * prod.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trợ giúp & Hỗ trợ giao nhận */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 text-[#DC2626] flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0A0A0A] uppercase">
                Cần Hỗ Trợ Giao Nhận Hỏa Tốc?
              </h4>
              <p className="text-xs text-neutral-500">
                Bộ phận điều phối NewMos luôn sẵn sàng hỗ trợ bạn 7 ngày trong tuần.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="tel:19008888"
              className="px-4 py-2.5 rounded-lg bg-[#0A0A0A] hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Hotline 1900 8888
            </a>
            <Link
              to="/policy"
              className="px-4 py-2.5 rounded-lg border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Chính Sách Giao Nhận
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderTrackingPage;
