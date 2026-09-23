import { useState, useEffect } from 'react';
import { useLocation, useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Package,
  Truck,
  Copy,
  Check,
  ArrowRight,
  ShoppingBag,
  MapPin,
  Phone,
  ShieldCheck,
  AlertCircle,
  QrCode,
  Download,
  Home,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { orderService } from '../services/orderService';

// Cấu hình ngân hàng thụ hưởng mẫu (MBBank & Vietcombank)
const BANK_CONFIGS = {
  MB: {
    id: 'MB',
    name: 'MBBank (Ngân Hàng TMCP Quân Đội)',
    shortName: 'MBBank',
    accountNo: '0987654321',
    accountName: 'NEWMOS STORE',
    branch: 'Chi nhánh Hà Nội / TP.HCM',
    badge: 'Khuyên Dùng',
    accentColor: 'border-blue-500 text-blue-600',
    tabActive: 'bg-blue-600 text-white shadow-md shadow-blue-600/30',
  },
  VCB: {
    id: 'VCB',
    name: 'Vietcombank (Ngoại Thương Việt Nam)',
    shortName: 'Vietcombank',
    accountNo: '0987654321',
    accountName: 'NEWMOS STORE',
    branch: 'Chi nhánh TP. Hồ Chí Minh',
    badge: 'Phổ Biến',
    accentColor: 'border-emerald-500 text-emerald-600',
    tabActive: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30',
  },
};

export function OrderSuccessPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // 1. Trích xuất mã đơn từ searchParams (?code=... hoặc ?orderId=...) hoặc location.state
  const queryCode = searchParams.get('code') || searchParams.get('orderId');
  const orderState = location.state || {};
  const initialOrderCode =
    queryCode ||
    orderState.orderCode ||
    orderState.orderId ||
    orderState.orderData?.orderCode ||
    '';

  const [orderCode, setOrderCode] = useState(initialOrderCode || 'NM-829142');
  const [fetchedOrder, setFetchedOrder] = useState(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(Boolean(queryCode && !orderState.orderData));

  // VietQR state
  const [selectedBank, setSelectedBank] = useState('MB');
  const [isQrLoaded, setIsQrLoaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null); // 'orderCode' | 'accountNo' | 'amount' | 'addInfo' | 'all'
  const [hasConfirmedPaid, setHasConfirmedPaid] = useState(false);
  const [showItemsList, setShowItemsList] = useState(true);

  // 2. Tự động nạp dữ liệu chi tiết đơn từ Database nếu người dùng truy cập trực tiếp qua link
  useEffect(() => {
    if (queryCode && !orderState.orderData) {
      orderService
        .getOrderByCode(queryCode)
        .then((res) => {
          const data = res?.data || res;
          if (data && (data.orderCode || data.id)) {
            setFetchedOrder(data);
            setOrderCode(data.orderCode || queryCode);
          }
        })
        .catch((err) => {
          console.error('Không thể tải chi tiết đơn hàng:', err);
        })
        .finally(() => {
          setIsLoadingOrder(false);
        });
    }
  }, [queryCode, orderState.orderData]);

  const activeOrder = fetchedOrder || orderState.orderData;
  const customerName =
    activeOrder?.customerName ||
    activeOrder?.recipientName ||
    orderState.formData?.fullName ||
    'Quý Khách NewMos';
  const customerPhone =
    activeOrder?.phone ||
    activeOrder?.recipientPhone ||
    orderState.formData?.phone ||
    '';
  const customerEmail =
    activeOrder?.recipientEmail || orderState.formData?.email || '';
  const customerAddress =
    activeOrder?.shippingAddress ||
    [orderState.formData?.address, orderState.formData?.city]
      .filter(Boolean)
      .join(', ') ||
    'Địa chỉ nhận hàng tiêu chuẩn';
  const paymentMethod = (
    activeOrder?.paymentMethod ||
    orderState.paymentMethod ||
    'vietqr'
  ).toLowerCase();
  const grandTotal = activeOrder?.totalAmount
    ? Number(activeOrder.totalAmount)
    : orderState.grandTotal || 0;

  const orderItems =
    activeOrder?.items && activeOrder.items.length > 0
      ? activeOrder.items.map((it) => ({
          id: it.id,
          name: it.productName,
          size: it.size,
          price: it.price || it.unitPrice,
          quantity: it.quantity,
          image: it.productImage,
          color: it.color || 'Bản Tiêu Chuẩn',
        }))
      : orderState.items && orderState.items.length > 0
      ? orderState.items
      : [];

  // Ngân hàng hiện tại đang chọn
  const currentBank = BANK_CONFIGS[selectedBank] || BANK_CONFIGS.MB;
  const safeAmount = Math.max(0, Math.round(Number(grandTotal) || 0));

  // Cơ chế tạo URL VietQR mở
  // https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-compact2.png?amount=<AMOUNT>&addInfo=<ORDER_CODE>&accountName=<ACCOUNT_NAME>
  const vietQrUrl = `https://img.vietqr.io/image/${currentBank.id}-${currentBank.accountNo}-compact2.png?amount=${safeAmount}&addInfo=${encodeURIComponent(
    orderCode
  )}&accountName=${encodeURIComponent(currentBank.accountName)}`;

  // Xử lý sao chép từng trường
  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2500);
  };

  // Sao chép toàn bộ thông tin chuyển khoản
  const handleCopyAll = () => {
    const fullInfo = [
      `THÔNG TIN CHUYỂN KHOẢN ĐƠN HÀNG NEWMOS [${orderCode}]`,
      `---------------------------------------`,
      `Ngân hàng: ${currentBank.name}`,
      `Số tài khoản: ${currentBank.accountNo}`,
      `Chủ tài khoản: ${currentBank.accountName}`,
      `Số tiền: ${formatCurrency(safeAmount)} (${safeAmount} VND)`,
      `Nội dung CK: ${orderCode}`,
      `---------------------------------------`,
      `Vui lòng ghi chính xác nội dung chuyển khoản để hệ thống xác nhận tự động.`,
    ].join('\n');

    navigator.clipboard.writeText(fullInfo);
    setCopiedKey('all');
    setTimeout(() => {
      setCopiedKey((prev) => (prev === 'all' ? null : prev));
    }, 2500);
  };

  // Tải ảnh VietQR về thiết bị
  const handleDownloadQr = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(vietQrUrl, { mode: 'cors' });
      if (!response.ok) throw new Error('Không thể tải trực tiếp ảnh');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `VietQR_${orderCode}_${currentBank.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.warn('Tải bằng Blob gặp sự cố, mở ảnh trực tiếp:', err);
      // Fallback tải trực tiếp hoặc mở tab mới
      const link = document.createElement('a');
      link.href = vietQrUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = `VietQR_${orderCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8 sm:py-14 text-slate-900 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Thanh báo hiệu đang đồng bộ dữ liệu nếu truy cập trực tiếp qua URL */}
        {isLoadingOrder && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center gap-2 text-xs font-mono text-red-700 animate-pulse">
            <div className="w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            <span>Đang đồng bộ chi tiết đơn hàng từ máy chủ NewMos...</span>
          </div>
        )}

        {/* ========================================================
            1. BANNER CHÚC MỪNG & TRẠNG THÁI ĐẶT HÀNG THÀNH CÔNG
           ======================================================== */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm relative overflow-hidden">
          {/* Background Tech Accent */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-900/5 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20" />

          <div className="relative z-10 flex flex-col items-center text-center space-y-4">
            {/* Animated Check Icon */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center text-white shadow-xl shadow-red-600/30 animate-in zoom-in-50 duration-300">
                <CheckCircle2 className="w-11 h-11 stroke-[2.5]" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-6 w-6 bg-emerald-500 border-2 border-white items-center justify-center text-[10px] text-white font-bold">✓</span>
              </span>
            </div>

            {/* Title & Badge */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0A0A0A] text-white text-[11px] font-mono font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
                <span>ĐẶT HÀNG THÀNH CÔNG // NEWMOS CORE SYSTEM</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-[#0A0A0A] uppercase tracking-tight font-display">
                Cảm Ơn Bạn Đã Đặt Hàng!
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
                Đơn hàng của bạn đã được ghi nhận trên hệ thống và chuyển sang bộ phận kiểm định AI chuẩn bị xuất kho.
                {customerEmail && (
                  <> Thông báo chi tiết đã được gửi tới email <span className="font-semibold text-slate-900">{customerEmail}</span>.</>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================
            2. BỐ CỤC 2 CỘT THỂ THAO ĐEN - TRẮNG - ĐỎ
               - BÊN TRÁI: Mã đơn hàng, Tổng tiền, Người nhận, Sản phẩm
               - BÊN PHẢI: Thẻ thanh toán VietQR ngân hàng tự động
           ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ====================================================
              CỘT TRÁI: THÔNG TIN ĐƠN HÀNG (7 COLS TRÊN DESKTOP)
             ==================================================== */}
          <div className="lg:col-span-7 space-y-6">

            {/* THẺ MÃ ĐƠN HÀNG NỔI BẬT (Phong cách thể thao NewMos Đen - Đỏ) */}
            <div className="relative bg-[#0A0A0A] text-white border-2 border-[#DC2626] rounded-3xl p-6 sm:p-7 shadow-xl shadow-red-950/20 overflow-hidden">
              {/* Corner accents */}
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-red-500" />
              <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-red-500" />
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-red-500" />
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-red-500" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-widest text-neutral-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span>MÃ ĐƠN HÀNG CHÍNH THỨC</span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-mono font-black text-red-500 tracking-wider mt-1 select-all">
                    {orderCode}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(orderCode, 'orderCode')}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      copiedKey === 'orderCode'
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 hover:border-red-500'
                    }`}
                    title="Sao chép mã đơn hàng"
                  >
                    {copiedKey === 'orderCode' ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-red-400" />
                        <span>Sao chép mã</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                <span className="inline-flex items-center gap-1.5 text-neutral-300">
                  <ShieldCheck className="w-4 h-4 text-red-500" />
                  Đã ghi nhận trên hệ thống đối soát bảo hành NewMos
                </span>
                <span className="font-mono text-neutral-500 text-[10px]">24/7 AUTO SYNC</span>
              </div>
            </div>

            {/* THẺ TỔNG TIỀN CẦN THANH TOÁN */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                  TỔNG TIỀN CẦN THANH TOÁN
                </span>
                <div className="text-3xl sm:text-4xl font-black text-red-600 font-mono tracking-tight">
                  {formatCurrency(grandTotal)}
                </div>
              </div>

              <div className="flex flex-col items-start sm:items-end gap-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                  {paymentMethod === 'vietqr'
                    ? 'Chờ Chuyển Khoản VietQR'
                    : paymentMethod === 'cod'
                    ? 'Thanh Toán COD (Khi Nhận Hàng)'
                    : 'Thanh Toán Thẻ Trực Tuyến'}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Miễn phí vận chuyển toàn quốc
                </span>
              </div>
            </div>

            {/* THÔNG TIN NGƯỜI NHẬN & GIAO HÀNG */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono flex items-center gap-2 pb-3 border-b border-slate-100">
                <MapPin className="w-4 h-4 text-red-600" />
                <span>THÔNG TIN NGƯỜI NHẬN & ĐỊA CHỈ GIAO HÀNG</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-500 block text-[10px] uppercase font-mono font-bold">
                    Khách Hàng / Người Nhận
                  </span>
                  <div className="font-bold text-slate-900 text-sm">{customerName}</div>
                  {customerPhone && (
                    <div className="flex items-center gap-1 text-slate-600 font-mono pt-0.5">
                      <Phone className="w-3 h-3 text-red-500" />
                      <span>{customerPhone}</span>
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-500 block text-[10px] uppercase font-mono font-bold">
                    Hình thức giao hàng
                  </span>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-red-600" />
                    <span>SPX Express Siêu Tốc</span>
                  </div>
                  <span className="text-slate-500 block text-[11px]">
                    Dự kiến giao hàng trong 2 - 3 ngày làm việc
                  </span>
                </div>

                <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-500 block text-[10px] uppercase font-mono font-bold">
                    Địa chỉ nhận hàng chi tiết
                  </span>
                  <div className="font-medium text-slate-800 leading-relaxed">
                    {customerAddress}
                  </div>
                </div>
              </div>
            </div>

            {/* SẢN PHẨM TRONG ĐƠN HÀNG (Có thể mở rộng/thu gọn) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-red-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
                    SẢN PHẨM TRONG ĐƠN ({orderItems.length})
                  </h3>
                </div>
                <button
                  onClick={() => setShowItemsList(!showItemsList)}
                  className="inline-flex items-center gap-1 text-xs font-mono font-bold text-slate-600 hover:text-red-600 cursor-pointer"
                >
                  <span>{showItemsList ? 'Thu gọn' : 'Xem chi tiết'}</span>
                  {showItemsList ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>

              {showItemsList && (
                <div className="space-y-3">
                  {orderItems.length > 0 ? (
                    orderItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-all"
                      >
                        <img
                          src={
                            item.image ||
                            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=200&q=80'
                          }
                          alt={item.name}
                          className="w-14 h-14 rounded-xl object-cover bg-white border border-slate-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                            <span>Size: <strong className="text-slate-800">{item.size} EU</strong></span>
                            <span>•</span>
                            <span>SL: <strong className="text-slate-800">x{item.quantity}</strong></span>
                            {item.color && (
                              <>
                                <span>•</span>
                                <span className="truncate">{item.color}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-xs font-mono font-bold text-slate-900 text-right shrink-0">
                          <div>{formatCurrency(Number(item.price) * Number(item.quantity))}</div>
                          <span className="text-[10px] text-slate-400 block font-normal">
                            {formatCurrency(Number(item.price))}/đôi
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500">
                      Sản phẩm giày Sneaker NewMos chính hãng
                    </div>
                  )}

                  {/* Tóm tắt thanh toán */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Thành tiền sau ưu đãi:</span>
                    <span className="font-black text-base text-red-600">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* TIẾN TRÌNH XỬ LÝ 3 BƯỚC */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 font-mono">
                QUY TRÌNH XỬ LÝ ĐƠN HÀNG TỰ ĐỘNG
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-red-50/70 border border-red-200">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="w-6 h-6 rounded-lg bg-red-600 text-white flex items-center justify-center text-[10px] font-mono font-bold">1</span>
                    <span className="text-xs font-bold text-slate-900">Tiếp Nhận Đơn</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Đã khóa tồn kho và khởi tạo mã vận đơn</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="w-6 h-6 rounded-lg bg-slate-300 text-slate-700 flex items-center justify-center text-[10px] font-mono font-bold">2</span>
                    <span className="text-xs font-bold text-slate-900">Kiểm Định AI</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Kiểm tra tem Authentic & đóng gói bảo hiểm</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="w-6 h-6 rounded-lg bg-slate-300 text-slate-700 flex items-center justify-center text-[10px] font-mono font-bold">3</span>
                    <span className="text-xs font-bold text-slate-900">Vận Chuyển</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Bàn giao bưu tá SPX Express giao tận nơi</p>
                </div>
              </div>
            </div>

          </div>

          {/* ====================================================
              CỘT PHẢI: THẺ THANH TOÁN VIETQR NGÂN HÀNG TỰ ĐỘNG
              (5 COLS TRÊN DESKTOP - THỂ THAO ĐEN - TRẮNG - ĐỎ)
             ==================================================== */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">

            {/* CARD VIETQR CAO CẤP */}
            <div className="bg-white rounded-3xl border-2 border-slate-900 p-6 sm:p-7 shadow-xl shadow-slate-900/10 relative overflow-hidden space-y-5">
              
              {/* Card Header Sporty Red-Black */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-600/30">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-tight text-[#0A0A0A] font-display">
                      Thanh Toán VietQR 24/7
                    </h2>
                    <span className="text-[11px] font-mono font-bold text-red-600 block">
                      AUTO PAYMENT // NAPAS 247
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold text-slate-700">
                  <Sparkles className="w-3 h-3 text-red-600" />
                  <span>Xác nhận tức thì</span>
                </div>
              </div>

              {/* Tùy chọn chuyển đổi Ngân Hàng Thụ Hưởng (MBBank / Vietcombank) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-500 uppercase">
                  <span>Chọn ngân hàng thụ hưởng:</span>
                  <span className="text-[10px] text-red-600 font-normal">Hỗ trợ 40+ app ngân hàng</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(BANK_CONFIGS).map((bank) => (
                    <button
                      key={bank.id}
                      onClick={() => {
                        setSelectedBank(bank.id);
                        setIsQrLoaded(false);
                      }}
                      className={`px-3 py-2.5 rounded-2xl text-xs font-mono font-bold transition-all flex flex-col items-center justify-center gap-0.5 border cursor-pointer ${
                        selectedBank === bank.id
                          ? `${bank.tabActive} border-transparent scale-[1.02]`
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <span className="font-display font-black text-sm tracking-tight">{bank.shortName}</span>
                      <span className="text-[9px] uppercase tracking-wider opacity-80">{bank.badge}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* KHUNG HIỂN THỊ MÃ VIETQR (Phong cách thể thao góc bo chuẩn Scanner) */}
              <div className="relative p-4 bg-slate-900 rounded-3xl text-center space-y-3 shadow-inner">
                {/* 4 Góc Scanner thể thao màu đỏ */}
                <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-red-500 rounded-tl" />
                <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-red-500 rounded-tr" />
                <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-red-500 rounded-bl" />
                <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-red-500 rounded-br" />

                {/* Badge số tiền hiển thị trên đầu mã QR */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800 text-white border border-neutral-700 text-xs font-mono font-bold">
                  <span>Số tiền:</span>
                  <span className="text-red-400 font-black">{formatCurrency(safeAmount)}</span>
                </div>

                {/* QR Image Container */}
                <div className="relative mx-auto max-w-[270px] bg-white p-3 rounded-2xl shadow-lg border border-neutral-200 min-h-[270px] flex items-center justify-center">
                  {!isQrLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-2xl space-y-2 z-10">
                      <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-[11px] font-mono text-slate-500">Đang tạo mã VietQR...</span>
                    </div>
                  )}

                  <img
                    src={vietQrUrl}
                    alt={`VietQR ${currentBank.shortName} - ${orderCode}`}
                    className={`w-full h-auto object-contain rounded-xl transition-opacity duration-300 ${
                      isQrLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => setIsQrLoaded(true)}
                  />
                </div>

                {/* Hướng dẫn quét mã QR */}
                <div className="bg-neutral-800/90 rounded-2xl p-3 border border-neutral-700/80 text-left flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                    <strong className="text-white font-semibold">Hướng dẫn:</strong> Mở ứng dụng ngân hàng quét mã QR để thanh toán nhanh (Nội dung và số tiền đã được điền sẵn).
                  </p>
                </div>
              </div>

              {/* BẢNG CHI TIẾT THÔNG TIN CHUYỂN KHOẢN (Có nút Copy từng mục) */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  CHI TIẾT CHUYỂN KHOẢN THỦ CÔNG
                </div>

                <div className="divide-y divide-slate-100 bg-slate-50 rounded-2xl border border-slate-200 text-xs overflow-hidden">
                  
                  {/* Ngân hàng */}
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">Ngân hàng</span>
                      <span className="font-bold text-slate-900">{currentBank.name}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                      {currentBank.id}
                    </span>
                  </div>

                  {/* Số tài khoản */}
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">Số tài khoản</span>
                      <span className="font-mono font-black text-slate-900 text-sm select-all">
                        {currentBank.accountNo}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(currentBank.accountNo, 'accountNo')}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        copiedKey === 'accountNo'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:border-red-500 hover:text-red-600'
                      }`}
                      title="Sao chép số tài khoản"
                    >
                      {copiedKey === 'accountNo' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Chủ tài khoản */}
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">Chủ tài khoản</span>
                      <span className="font-bold text-slate-900 uppercase font-mono">
                        {currentBank.accountName}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Đã xác thực
                    </span>
                  </div>

                  {/* Số tiền */}
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">Số tiền chính xác</span>
                      <span className="font-mono font-black text-red-600 text-sm">
                        {formatCurrency(safeAmount)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(String(safeAmount), 'amount')}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        copiedKey === 'amount'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:border-red-500 hover:text-red-600'
                      }`}
                      title="Sao chép số tiền"
                    >
                      {copiedKey === 'amount' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Nội dung chuyển khoản (addInfo) - Quan trọng nhất */}
                  <div className="p-3.5 bg-red-50/80 border-t-2 border-red-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1 text-[10px] font-mono uppercase font-bold text-red-700">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Nội dung chuyển khoản (bắt buộc)</span>
                      </div>
                      <span className="font-mono font-black text-red-600 text-base select-all tracking-wider block mt-0.5">
                        {orderCode}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Giữ nguyên mã đơn để hệ thống tự động xác nhận đơn
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopy(orderCode, 'addInfo')}
                      className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        copiedKey === 'addInfo'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-600/30'
                      }`}
                      title="Sao chép nội dung chuyển khoản"
                    >
                      {copiedKey === 'addInfo' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Chép nội dung</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              </div>

              {/* CÁC NÚT THAO TÁC TIỆN ÍCH */}
              <div className="space-y-2.5 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Nút Tải ảnh QR */}
                  <button
                    onClick={handleDownloadQr}
                    disabled={isDownloading}
                    className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : downloadSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Đã tải ảnh về</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 text-red-400" />
                        <span>Tải ảnh QR</span>
                      </>
                    )}
                  </button>

                  {/* Nút Sao chép tất cả thông tin */}
                  <button
                    onClick={handleCopyAll}
                    className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 hover:border-red-500 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {copiedKey === 'all' ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-600">Đã chép toàn bộ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-600" />
                        <span>Sao chép thông tin</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Nút Xác Nhận: Tôi Đã Chuyển Khoản Xong */}
                <button
                  onClick={() => setHasConfirmedPaid(true)}
                  disabled={hasConfirmedPaid}
                  className={`w-full py-3.5 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    hasConfirmedPaid
                      ? 'bg-emerald-50 border border-emerald-300 text-emerald-700'
                      : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25 active:scale-98'
                  }`}
                >
                  <CheckCircle2 className={`w-4 h-4 ${hasConfirmedPaid ? 'text-emerald-600' : 'text-white'}`} />
                  <span>
                    {hasConfirmedPaid
                      ? '✓ Đã Báo Chuyển Khoản - Đang Đối Soát'
                      : 'Tôi Đã Chuyển Khoản Xong'}
                  </span>
                </button>

                {/* Thông báo phản hồi sau khi bấm xác nhận chuyển khoản */}
                {hasConfirmedPaid && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1 animate-in fade-in duration-300">
                    <div className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Đã gửi tín hiệu giao dịch đến NewMos Core!</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed font-sans">
                      Hệ thống đang kiểm tra biến động số dư tài khoản. Đơn hàng sẽ tự động chuyển sang trạng thái <strong>ĐÃ THANH TOÁN</strong> trong 1 - 3 phút.
                    </p>
                  </div>
                )}
              </div>

              {/* Cam kết giao dịch an toàn */}
              <div className="pt-2 text-center">
                <span className="text-[10px] text-slate-400 font-mono">
                  Giao dịch an toàn mã hóa 256-bit • VietQR / Napas247 Chuẩn Quốc Gia
                </span>
              </div>

            </div>

          </div>

        </div>

        {/* ========================================================
            3. THANH ĐIỀU HƯỚNG TIẾP TỤC (THEO DÕI ĐƠN & VỀ TRANG CHỦ)
           ======================================================== */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-center gap-4">
          
          {/* Nút 1: Theo dõi đơn hàng */}
          <button
            onClick={() =>
              navigate(`/order-tracking?orderId=${encodeURIComponent(orderCode)}`)
            }
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider shadow-xl shadow-red-600/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-98"
          >
            <Truck className="w-4 h-4" />
            <span>Theo Dõi Đơn Hàng</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          {/* Nút 2: Về trang chủ */}
          <Link
            to="/"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#0A0A0A] hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-98 shadow-md"
          >
            <Home className="w-4 h-4" />
            <span>Về Trang Chủ</span>
          </Link>

          {/* Nút 3: Tiếp tục mua sắm */}
          <Link
            to="/shop"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 hover:border-slate-900 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-98"
          >
            <ShoppingBag className="w-4 h-4 text-red-600" />
            <span>Tiếp Tục Mua Sắm</span>
          </Link>
        </div>

      </div>
    </div>
  );
}

export default OrderSuccessPage;
