import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Zap,
  Target,
} from 'lucide-react';
import { ProductCard } from '../components/product/ProductCard';
import { QuickViewModal } from '../components/product/QuickViewModal';
import { Toast } from '../components/common/Toast';
import { useAIStore } from '../stores/useAIStore';
import { productService } from '../services/productService';
import { formatCurrency, cn } from '../lib/utils';

export function HomePage() {
  const navigate = useNavigate();
  const { setModalOpen, resetAI } = useAIStore();

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('TẤT CẢ');
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [toast, setToast] = useState(null);

  // Fetch real products from backend API
  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const params = { pageSize: 12 };
        if (activeCategory !== 'TẤT CẢ') {
          params.category = activeCategory;
        }
        const res = await productService.getAllProducts(params);
        if (isMounted) {
          const list =
            res.data?.content ||
            (Array.isArray(res.data) ? res.data : null) ||
            (Array.isArray(res) ? res : []) ||
            [];
          setProducts(list);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Lỗi khi tải danh sách sản phẩm từ API:', err);
          setProducts([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProducts();
    return () => {
      isMounted = false;
    };
  }, [activeCategory]);

  const handleOpenAIGuide = () => {
    resetAI();
    setModalOpen(true);
  };

  const handleShowToast = (toastData) => {
    setToast(toastData);
    setTimeout(() => {
      setToast((curr) => (curr === toastData ? null : curr));
    }, 3500);
  };

  const handleOpenPdp = (product) => {
    navigate(`/product/${product.id}`);
  };

  return (
    <div className="bg-[#F9FAFB] text-slate-900 font-sans">
      {/* SECTION 1: HERO SECTION */}
      <section className="relative bg-white bg-tech-grid border-b border-slate-200 overflow-hidden pt-12 pb-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headline, Bio & Telemetry Stats */}
            <div className="lg:col-span-7 space-y-6">
              {/* System Protocol Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A0A0A] text-white text-[11px] font-mono font-bold tracking-wider shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
                <span>GIAO THỨC CÔNG NGHỆ // SIZE CHUẨN XÁC</span>
              </div>

              {/* Main Brutalist Headline (Balanced Typography) */}
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-slate-950 leading-[1.08]">
                  BỨT PHÁ <span className="text-[#DC2626]">TỐC ĐỘ</span> <br />
                  VỪA VẶN HOÀN HẢO
                </h1>

                <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-mono font-black uppercase">
                  <span className="px-2.5 py-1 bg-[#0A0A0A] text-white rounded-md tracking-wider">
                    [PERFECT FIT]
                  </span>
                  <span className="text-[#DC2626] tracking-wide">
                    CHUẨN XÁC TỪNG MILIMET
                  </span>
                </div>
              </div>

              {/* Body description */}
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl font-normal">
                Không còn nỗi lo chọn nhầm kích cỡ giày khi mua sắm trực tuyến. Bảng quy đổi thông minh NewMos Size-Fit tính toán chính xác size giày chuẩn dựa trên số đo chiều dài và dáng bàn chân của bạn theo thời gian thực.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => navigate('/shop')}
                  className="px-8 py-3.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer rounded-lg active:scale-98"
                >
                  <span>KHÁM PHÁ SẢN PHẨM NGAY</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleOpenAIGuide}
                  className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs uppercase tracking-widest border border-slate-300 hover:border-[#DC2626] flex items-center gap-2 transition-all cursor-pointer rounded-lg"
                >
                  <Zap className="w-4 h-4 text-[#DC2626] fill-[#DC2626]" />
                  <span>HƯỚNG DẪN ĐO & TÍNH SIZE</span>
                </button>
              </div>

              {/* Telemetry Stats Bar */}
              <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-6 max-w-lg font-mono">
                <div>
                  <div className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950">
                    310<span className="text-[#DC2626] text-2xl font-bold">g</span>
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5 font-bold">
                    TRỌNG LƯỢNG SIÊU NHẸ
                  </div>
                </div>

                <div className="border-l border-slate-200 pl-6">
                  <div className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950">
                    100<span className="text-[#DC2626] text-2xl font-bold">%</span>
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5 font-bold">
                    TỶ LỆ VỪA VẶN CHUẨN XÁC
                  </div>
                </div>

                <div className="border-l border-slate-200 pl-6">
                  <div className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950">
                    0.02<span className="text-[#DC2626] text-2xl font-bold">s</span>
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5 font-bold">
                    TÍNH SIZE TỨC THÌ
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Sneaker Card */}
            <div className="lg:col-span-5 relative">
              {isLoading ? (
                <div className="relative rounded-2xl bg-white border border-slate-200 p-8 shadow-2xl overflow-hidden animate-pulse">
                  <div className="h-6 w-36 bg-slate-200 rounded mb-6" />
                  <div className="aspect-4/3 bg-slate-200 rounded-xl mb-4" />
                  <div className="h-4 w-28 bg-slate-200 rounded mb-2" />
                  <div className="h-6 w-48 bg-slate-200 rounded" />
                </div>
              ) : products[0] ? (
                <div className="relative rounded-2xl bg-white border border-slate-200 p-8 shadow-2xl shadow-slate-200/50 overflow-hidden group">
                  <div className="flex items-center gap-2 mb-6 font-mono text-[10px]">
                    <span className="px-2.5 py-1 rounded-sm bg-[#DC2626] text-white font-black uppercase tracking-wider shadow-xs">
                      ĐỘC QUYỀN PHÒNG LAB
                    </span>
                    <span className="px-2.5 py-1 rounded-sm bg-[#0A0A0A] text-white font-bold uppercase tracking-wider">
                      {products[0].brandName || 'SNEAKER'} // DROP 01
                    </span>
                  </div>

                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none text-8xl sm:text-9xl font-black text-slate-100 z-0">
                    FIT
                  </div>

                  <div
                    onClick={() => handleOpenPdp(products[0])}
                    className="relative z-10 aspect-4/3 flex items-center justify-center cursor-pointer"
                  >
                    <img
                      src={
                        products[0].defaultThumbnail ||
                        products[0].image ||
                        products[0].variants?.[0]?.thumbnailUrl ||
                        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85'
                      }
                      alt={products[0].name}
                      className="w-full h-full object-contain transform group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-700 ease-out drop-shadow-2xl"
                    />
                  </div>

                  <div className="relative z-10 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                        MÃ SẢN PHẨM // {products[0].code || 'K-HYPER-01'}
                      </div>
                      <div className="text-sm font-black uppercase tracking-tight text-slate-900 line-clamp-1">
                        {products[0].name}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-base font-black text-[#DC2626] font-mono">
                        {formatCurrency(products[0].minPrice || products[0].price || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: SIZE CALCULATOR & GUIDE ACTIVE RIBBON */}
      <section className="bg-[#0A0A0A] text-white py-4 px-4 sm:px-6 lg:px-8 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-[#DC2626] flex items-center justify-center text-white shrink-0 shadow-sm shadow-red-600/50">
              <Target className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-black uppercase tracking-wider text-white">
                <span>BỘ TÍNH SIZE CHÂN CHUẨN XÁC NEWMOS</span>
                <span className="px-1.5 py-0.2 bg-red-600/30 text-red-400 border border-red-500/40 text-[9px] rounded-xs">
                  CHUẨN XÁC 100%
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Chưa chắc chắn về kích cỡ? Nhập số đo cm bàn chân để đối chiếu kích thước chuẩn phom giày thể thao NewMos.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenAIGuide}
            className="px-6 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs uppercase tracking-wider rounded-lg shrink-0 transition-colors shadow-sm cursor-pointer"
          >
            HƯỚNG DẪN ĐO & TÍNH SIZE
          </button>
        </div>
      </section>

      {/* SECTION 3: THE DROP VAULT (PRODUCT GRID) */}
      <section id="vault" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6 border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-widest text-[#DC2626]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>BỘ SƯU TẬP SNEAKER CHÍNH HÃNG 2026</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-slate-950">
              SẢN PHẨM NỔI BẬT{' '}
              <span className="text-slate-400 font-mono text-xl sm:text-2xl font-bold">
                ({isLoading ? '...' : products.length} MẪU)
              </span>
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: 'TẤT CẢ', value: 'TẤT CẢ' },
              { label: 'CHẠY BỘ (RUNNING)', value: 'running' },
              { label: 'CHẠY BỘ & TẬP LUYỆN', value: 'running-training' },
              { label: 'THỂ THAO ĐA NĂNG', value: 'the-thao-da-nang' },
              { label: 'THỜI TRANG & CHẠY BỘ', value: 'thoi-trang-chay-bo' },
              { label: 'BÓNG RỔ (BASKETBALL)', value: 'basketball' },
              { label: 'THỜI TRANG (LIFESTYLE)', value: 'lifestyle' },
            ].map((cat) => {
              const isActive = activeCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={cn(
                    'px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer',
                    isActive
                      ? 'bg-[#0A0A0A] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                  )}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs animate-pulse p-4 space-y-4"
              >
                <div className="aspect-4/3 bg-slate-200 rounded-lg" />
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-5 bg-slate-200 rounded w-3/4" />
                  <div className="h-6 bg-slate-200 rounded w-1/2" />
                </div>
                <div className="grid grid-cols-6 gap-1 pt-2">
                  {[...Array(6)].map((_, sIdx) => (
                    <div key={sIdx} className="h-7 bg-slate-200 rounded" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && products.length === 0 && (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white p-8">
            <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black uppercase text-slate-900">Không tìm thấy sản phẩm nào</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Không có sản phẩm nào trong danh mục đã chọn. Vui lòng chọn danh mục khác hoặc xem tất cả.
            </p>
            <button
              onClick={() => setActiveCategory('TẤT CẢ')}
              className="mt-4 px-6 py-2.5 bg-[#0A0A0A] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
            >
              Xem tất cả sản phẩm
            </button>
          </div>
        )}

        {/* Product Cards Grid */}
        {!isLoading && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {products.map((shoe) => (
              <ProductCard
                key={shoe.id}
                product={shoe}
                onQuickView={(p) => handleOpenPdp(p)}
                onShowToast={handleShowToast}
              />
            ))}
          </div>
        )}
      </section>

      {/* SECTION 4: PROPRIETARY NEURAL INFERENCE */}
      <section className="bg-white border-t border-slate-200 py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left side */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-widest text-[#DC2626]">
                <Zap className="w-3.5 h-3.5 fill-[#DC2626]" />
                <span>BỘ TÍNH SIZE THÔNG MINH & TRỢ LÝ NEWMOS AI</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-slate-950 leading-tight">
                VÌ SAO BẠN KHÔNG BAO GIỜ PHẢI ĐỔI TRẢ SIZE?
              </h2>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Các phương pháp chọn size truyền thống thường bỏ qua dáng chân và form giày. NewMos kết hợp hướng dẫn tự đo chân tại nhà qua 2 bước đo chiều dài bàn chân cùng Trợ lý NewMos AI tư vấn nhiệt tình 24/7, giúp bạn sở hữu đôi giày vừa vặn hoàn hảo ngay từ đơn hàng đầu tiên.
              </p>

              {/* Feature Cards / Value Props */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-[#DC2626] flex items-center justify-center font-bold text-xs shrink-0">
                    01
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase">
                      Hướng dẫn tự đo chân tại nhà & Tự động đề xuất size chuẩn xác
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Chỉ với 2 bước đo chiều dài bàn chân (cm) để đối chiếu chính xác ma trận size chuẩn NewMos.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-[#DC2626] flex items-center justify-center font-bold text-xs shrink-0">
                    02
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase">
                      NewMos AI Assistant: Hỗ trợ tư vấn form giày và tra cứu tình trạng đơn hàng 24/7
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Trợ lý AI sẵn sàng giải đáp thắc mắc về độ êm, độ ôm mu bàn chân và chính sách đổi trả.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2 font-mono">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    TỶ LỆ ĐỔI TRẢ TRÊN THỊ TRƯỜNG ONLINE
                  </span>
                  <span className="text-lg font-bold text-slate-900">
                    38.4%
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#0A0A0A] text-white flex items-center justify-between border border-neutral-800 shadow-lg">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                    TỶ LỆ ĐỔI TRẢ KHI TÍNH SIZE TẠI NEWMOS
                  </span>
                  <span className="text-xl font-black text-red-500">
                    0.2%
                  </span>
                </div>
              </div>
            </div>

            {/* Right side: Live Telemetry Calibration Card with Wave Graph */}
            <div className="lg:col-span-6">
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] animate-ping" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      HIỆU CHUẨN FORM GIÀY THỰC TẾ // CHUẨN SIZE NEWMOS
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold font-mono">
                    MODEL ID: DART-NODE-093
                  </span>
                </div>

                <div className="relative h-44 bg-white rounded-xl p-4 border border-slate-200 overflow-hidden flex flex-col justify-between">
                  <div className="absolute inset-0 bg-tech-grid opacity-60" />

                  <svg className="w-full h-full relative z-10 overflow-visible" viewBox="0 0 400 120">
                    <path d="M 10 90 Q 90 10, 180 80 T 360 30" fill="none" stroke="#0A0A0A" strokeWidth="2" />
                    <path d="M 10 80 Q 100 110, 200 65 T 390 20" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeDasharray="4 2" />
                    <circle cx="180" cy="80" r="5" fill="#0A0A0A" />
                    <circle cx="270" cy="45" r="6" fill="#DC2626" />
                  </svg>

                  <div className="relative z-10 flex justify-end">
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      PHÂN TÁN LỰC TIẾP ĐẤT: 14.2 kN/m
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 font-mono">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                    <div className="text-[10px] font-bold uppercase text-slate-400">KHỚP BÀN CHÂN</div>
                    <div className="text-sm font-black text-slate-900 mt-1">CHUẨN XÁC</div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                    <div className="text-[10px] font-bold uppercase text-slate-400">KHÓA GÓT CHÂN</div>
                    <div className="text-sm font-black text-slate-900 mt-1">88.8%</div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                    <div className="text-[10px] font-bold uppercase text-slate-400">KHOẢNG MŨI CHÂN</div>
                    <div className="text-sm font-black text-[#DC2626] mt-1">+4.2 MM</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onShowToast={handleShowToast}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

export default HomePage;
