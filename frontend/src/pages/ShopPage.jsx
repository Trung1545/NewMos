import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  Sparkles,
  ChevronDown,
  RotateCcw,
  Check,
  Zap,
  Grid3X3,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  Target,
  Clock,
  ShoppingCart,
  PackageX,
} from 'lucide-react';
import { useCartStore } from '../stores/useCartStore';
import { useAIStore } from '../stores/useAIStore';
import { productService } from '../services/productService';
import { formatCurrency, cn } from '../lib/utils';

export function ShopPage({ onSelectProduct = (_product) => {} }) {
  const navigate = useNavigate();
  const { addToCart } = useCartStore();
  const { setModalOpen, resetAI } = useAIStore();

  // State dữ liệu thực từ Backend
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedSize, setSelectedSize] = useState('42');
  const [sizeUnit, setSizeUnit] = useState('EU'); // 'EU' | 'US'
  const [isDiagnosticActive, setIsDiagnosticActive] = useState(false);
  const [priceRange, setPriceRange] = useState(6000000);
  const [selectedColor, setSelectedColor] = useState('red');
  const [selectedDisciplines, setSelectedDisciplines] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const [layoutCols, setLayoutCols] = useState(3);
  const [likedShoes, setLikedShoes] = useState({});
  const [selectedCardSizes, setSelectedCardSizes] = useState({});
  const [addingId, setAddingId] = useState(null);

  const EU_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];

  // Gọi API lấy dữ liệu thực khi thay đổi bộ lọc
  useEffect(() => {
    let isMounted = true;
    const fetchShopProducts = async () => {
      setIsLoading(true);
      try {
        const params = {
          pageSize: 24,
          maxPrice: priceRange || undefined,
        };

        // Đồng bộ thương hiệu
        if (selectedBrands.length === 1) {
          params.brand = selectedBrands[0];
        }

        // Đồng bộ thể loại/danh mục
        if (selectedDisciplines.length === 1) {
          const discMap = {
            'Bóng Rổ Chuyên Nghiệp': 'basketball',
            'Chạy Bộ Marathon': 'running',
            'Chạy Bộ & Tập Luyện': 'running-training',
            'Thể Thao Đa Năng': 'the-thao-da-nang',
            'Thời Trang & Chạy Bộ': 'thoi-trang-chay-bo',
            'Thời Trang Đường Phố': 'lifestyle',
            'Chạy Bộ Nitro': 'running',
          };
          params.category = discMap[selectedDisciplines[0]] || selectedDisciplines[0];
        }

        // Đồng bộ sắp xếp
        if (sortBy === 'price-asc') params.sortBy = 'priceAsc';
        else if (sortBy === 'price-desc') params.sortBy = 'priceDesc';
        else if (sortBy === 'newest' || sortBy === 'highest-ai') params.sortBy = 'newest';

        const res = await productService.getAllProducts(params);
        if (isMounted) {
          let list =
            res.data?.content ||
            (Array.isArray(res.data) ? res.data : null) ||
            (Array.isArray(res) ? res : []) ||
            [];

          // Nếu người dùng chọn nhiều thương hiệu cùng lúc
          if (selectedBrands.length > 1) {
            list = list.filter((p) =>
              selectedBrands.some(
                (b) =>
                  (p.brandName || p.brand || '').toLowerCase().includes(b.toLowerCase()) ||
                  (p.brandCode || '').toLowerCase() === b.toLowerCase()
              )
            );
          }

          setProducts(list);
          setTotalCount(res.data?.totalElements ?? res.totalElements ?? list.length);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Lỗi tải sản phẩm tại ShopPage:', err);
          setProducts([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchShopProducts();
    return () => {
      isMounted = false;
    };
  }, [selectedBrands, selectedDisciplines, priceRange, sortBy]);

  const handleOpenSizeModal = () => {
    resetAI();
    setModalOpen(true);
  };

  const handleResetFilters = () => {
    setSelectedBrands([]);
    setSelectedSize('42');
    setIsDiagnosticActive(false);
    setPriceRange(6000000);
    setSelectedDisciplines([]);
    setSortBy('newest');
  };

  const handleDeploy = (shoe, e) => {
    e.stopPropagation();
    setAddingId(shoe.id);
    const chosenSize = selectedCardSizes[shoe.id] || shoe.defaultSize || '42';
    const shoePrice = shoe.price || shoe.minPrice || 0;
    const shoeImage =
      shoe.image || shoe.defaultThumbnail || shoe.variants?.[0]?.thumbnailUrl || '';

    addToCart(
      {
        id: String(shoe.id),
        name: shoe.name,
        price: shoePrice,
        image: shoeImage,
        color: shoe.color || shoe.categoryName || 'Bản Tiêu Chuẩn',
        brand: shoe.brand || shoe.brandName || 'NewMos',
        quantity: 1,
      },
      chosenSize
    );

    setTimeout(() => {
      setAddingId(null);
    }, 600);
  };

  const toggleBrand = (b) => {
    setSelectedBrands((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    );
  };

  const toggleDiscipline = (d) => {
    setSelectedDisciplines((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  return (
    <div className="bg-white text-slate-900 min-h-screen font-sans">
      {/* 1. Breadcrumb & Live Drop Telemetry Indicator */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="font-bold text-slate-800 uppercase">TRANG CHỦ</span>
            <span>/</span>
            <span className="text-slate-800 uppercase">TẤT CẢ SẢN PHẨM CHÍNH HÃNG</span>
            <span className="px-1.5 py-0.5 rounded-xs bg-slate-100 text-slate-700 text-[10px] font-bold">
              {totalCount || products.length} MẪU GIÀY
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              <span className="text-red-600 font-bold uppercase tracking-wider">
                HỆ THỐNG AI ĐANG KÍCH HOẠT
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>TÍNH TOÁN SIZE TỨC THÌ // TƯ VẤN FORM GIÀY CHUẨN XÁC</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Page Header Section */}
      <div className="border-b border-slate-200 bg-white py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            <div className="lg:col-span-8 space-y-2">
              <div className="text-xs font-mono font-bold uppercase tracking-widest text-red-600">
                DANH MỤC SẢN PHẨM // 2026
              </div>
              <h1 className="text-3xl sm:text-5xl xl:text-6xl font-black uppercase tracking-tight text-slate-950 leading-tight">
                BỘ SƯU TẬP <span className="text-red-600">SNEAKER</span> CHÍNH HÃNG
              </h1>
            </div>

            <div className="lg:col-span-4">
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
                Tuyển chọn những đôi sneaker thể thao trợ lực carbon thế hệ mới, tự động đề xuất độ vừa vặn chính xác 100% theo kích thước dáng chân của bạn.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Catalog Content: Sidebar + Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ================= LEFT FILTER SIDEBAR (3 cols) ================= */}
          <aside className="lg:col-span-3 space-y-7 pr-0 lg:pr-2">
            {/* Active Parameters Header */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-900">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-red-600" />
                  <span>BỘ LỌC ĐANG CHỌN</span>
                </div>
                <button
                  onClick={handleResetFilters}
                  className="text-[11px] font-bold uppercase text-red-600 hover:text-red-700 transition-colors cursor-pointer"
                >
                  XÓA TẤT CẢ
                </button>
              </div>

              {/* Active Filter Chips */}
              <div className="flex flex-wrap gap-1.5 pt-3">
                {selectedBrands.includes('Nike') && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-slate-100 text-slate-800 text-[11px] font-bold border border-slate-200">
                    Nike
                    <X
                      onClick={() => toggleBrand('Nike')}
                      className="w-3 h-3 cursor-pointer text-slate-500 hover:text-red-600"
                    />
                  </span>
                )}
                {selectedSize && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-red-600 text-white text-[11px] font-bold shadow-xs">
                    Size: {selectedSize} EU
                    <X
                      onClick={() => setSelectedSize(null)}
                      className="w-3 h-3 cursor-pointer hover:text-slate-200"
                    />
                  </span>
                )}
                {isDiagnosticActive && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-[#0A0A0A] text-white text-[11px] font-bold">
                    Khớp AI &gt; 90%
                    <X
                      onClick={() => setIsDiagnosticActive(false)}
                      className="w-3 h-3 cursor-pointer text-slate-400 hover:text-white"
                    />
                  </span>
                )}
              </div>
            </div>

            {/* AI FIT DIAGNOSTIC Card */}
            <div className="relative rounded-xl bg-[#0A0A0A] text-white p-4 overflow-hidden border border-neutral-800 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    BỘ LỌC ĐỘ KHỚP AI
                  </span>
                </div>
                <span className="px-1.5 py-0.2 rounded-xs bg-red-600 text-white text-[9px] font-mono font-black">
                  V2.0
                </span>
              </div>

              <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed">
                Tự động lọc những mẫu giày tương thích hoàn hảo với kích thước chân đã quét.
              </p>

              <div
                onClick={() => setIsDiagnosticActive(!isDiagnosticActive)}
                className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between cursor-pointer group"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-300 group-hover:text-white transition-colors">
                  CHỈ HIỆN ĐỘ KHỚP &gt; 98%
                </span>
                <div
                  className={cn(
                    'w-4 h-4 rounded-xs flex items-center justify-center transition-colors',
                    isDiagnosticActive ? 'bg-red-600 text-white' : 'border border-neutral-600'
                  )}
                >
                  {isDiagnosticActive && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            </div>

            {/* BRAND FOUNDRY */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">
                <span>THƯƠNG HIỆU</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { name: 'NewMos Sport', count: '04', isHot: true },
                  { name: 'Nike', count: '12' },
                  { name: 'Jordan', count: '08' },
                  { name: 'Puma / Kinetic', count: '06' },
                  { name: 'Adidas', count: '09' },
                ].map((b) => {
                  const isChecked = selectedBrands.includes(b.name);
                  return (
                    <div
                      key={b.name}
                      onClick={() => toggleBrand(b.name)}
                      className="flex items-center justify-between py-1 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'w-3.5 h-3.5 rounded-xs border flex items-center justify-center transition-colors',
                            isChecked
                              ? 'bg-red-600 border-red-600 text-white'
                              : 'border-slate-300 group-hover:border-slate-500'
                          )}
                        >
                          {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className="text-slate-800 group-hover:text-black font-semibold">
                          {b.name}
                        </span>
                      </div>
                      <span
                        className={cn(
                          'text-[11px] font-bold font-mono',
                          b.isHot ? 'text-red-600' : 'text-slate-400'
                        )}
                      >
                        {b.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SIZE LEDGER */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">
                <span>KÍCH THƯỚC (SIZE)</span>
                <div className="flex items-center bg-slate-100 p-0.5 rounded-xs text-[10px]">
                  <button
                    onClick={() => setSizeUnit('EU')}
                    className={cn(
                      'px-1.5 py-0.5 rounded-xs font-bold transition-all',
                      sizeUnit === 'EU' ? 'bg-[#0A0A0A] text-white' : 'text-slate-500'
                    )}
                  >
                    EU
                  </button>
                  <button
                    onClick={() => setSizeUnit('US')}
                    className={cn(
                      'px-1.5 py-0.5 rounded-xs font-bold transition-all',
                      sizeUnit === 'US' ? 'bg-[#0A0A0A] text-white' : 'text-slate-500'
                    )}
                  >
                    US
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {EU_SIZES.map((sz) => {
                  const isSelected = selectedSize === sz;
                  return (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={cn(
                        'py-1.5 text-center font-mono text-xs font-bold rounded-lg border transition-all cursor-pointer',
                        isSelected
                          ? 'bg-red-600 text-white border-red-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400'
                      )}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-red-600" />
                  <span className="text-red-600 font-bold font-mono">42 EU</span> chuẩn dáng chân bạn
                </span>
                <button
                  onClick={handleOpenSizeModal}
                  className="text-slate-800 underline hover:text-red-600 font-bold cursor-pointer"
                >
                  Đo lại
                </button>
              </div>
            </div>

            {/* PRICE RANGE */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">
                KHOẢNG GIÁ (VND)
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between gap-3 text-xs font-mono">
                  <div className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-800">
                    1.000.000 ₫
                  </div>
                  <span className="text-slate-400">-</span>
                  <div className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-800">
                    {formatCurrency(priceRange)}
                  </div>
                </div>

                <input
                  type="range"
                  min="1000000"
                  max="6000000"
                  step="100000"
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full mt-3 accent-red-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                />
              </div>
            </div>

            {/* COLOR */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">
                MÀU SẮC
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                {[
                  { id: 'red', hex: '#DC2626' },
                  { id: 'black', hex: '#0B0F19' },
                  { id: 'white', hex: '#F8FAFC', border: true },
                  { id: 'gray', hex: '#94A3B8' },
                  { id: 'navy', hex: '#1E293B' },
                ].map((col) => {
                  const isChecked = selectedColor === col.id;
                  return (
                    <button
                      key={col.id}
                      onClick={() => setSelectedColor(col.id)}
                      style={{ backgroundColor: col.hex }}
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs',
                        col.border ? 'border border-slate-300' : '',
                        isChecked ? 'ring-2 ring-red-600 ring-offset-2' : ''
                      )}
                    >
                      {isChecked && (
                        <Check
                          className={cn(
                            'w-3.5 h-3.5 stroke-[3]',
                            col.id === 'white' ? 'text-black' : 'text-white'
                          )}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DÒNG SẢN PHẨM */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">
                DÒNG SẢN PHẨM
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { name: 'Chạy Bộ Marathon', count: '08' },
                  { name: 'Chạy Bộ & Tập Luyện', count: '05' },
                  { name: 'Thể Thao Đa Năng', count: '04' },
                  { name: 'Thời Trang & Chạy Bộ', count: '04' },
                  { name: 'Bóng Rổ Chuyên Nghiệp', count: '10' },
                  { name: 'Thời Trang Đường Phố', count: '06' },
                ].map((d) => {
                  const isChecked = selectedDisciplines.includes(d.name);
                  return (
                    <div
                      key={d.name}
                      onClick={() => toggleDiscipline(d.name)}
                      className="flex items-center justify-between py-1 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'w-3.5 h-3.5 rounded-xs border flex items-center justify-center transition-colors',
                            isChecked
                              ? 'bg-red-600 border-red-600 text-white'
                              : 'border-slate-300 group-hover:border-slate-500'
                          )}
                        >
                          {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className="text-slate-800 group-hover:text-black font-semibold">
                          {d.name}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 font-mono">
                        {d.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* ================= RIGHT PRODUCT GRID (9 cols) ================= */}
          <main className="lg:col-span-9 space-y-6">
            {/* Top Order By & Column Toggles Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-4 text-xs">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-slate-500 font-bold uppercase tracking-wider">
                  SẮP XẾP THEO:
                </span>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-1.5 pr-8 font-bold focus:outline-none focus:border-red-600 cursor-pointer appearance-none"
                  >
                    <option value="highest-ai">Độ khớp AI cao nhất</option>
                    <option value="price-asc">Giá: Thấp đến cao</option>
                    <option value="price-desc">Giá: Cao đến thấp</option>
                    <option value="newest">Mới nhất</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto text-slate-500">
                <span className="text-[11px] font-medium">
                  {isLoading
                    ? 'Đang tải sản phẩm...'
                    : `Hiển thị 1-${products.length} của ${totalCount || products.length} sản phẩm`}
                </span>

                <div className="flex items-center gap-1 border-l border-slate-200 pl-4">
                  <button
                    onClick={() => setLayoutCols(3)}
                    className={cn(
                      'px-2 py-1 rounded-md flex items-center gap-1 font-bold text-[11px] transition-colors cursor-pointer',
                      layoutCols === 3
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : 'text-slate-600 hover:text-black'
                    )}
                  >
                    <Grid3X3 className="w-3 h-3" />
                    <span>3 CỘT</span>
                  </button>

                  <button
                    onClick={() => setLayoutCols(4)}
                    className={cn(
                      'px-2 py-1 rounded-md flex items-center gap-1 font-bold text-[11px] transition-colors cursor-pointer',
                      layoutCols === 4
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : 'text-slate-600 hover:text-black'
                    )}
                  >
                    <LayoutGrid className="w-3 h-3" />
                    <span>4 CỘT</span>
                  </button>

                  <button
                    onClick={handleResetFilters}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 ml-1 cursor-pointer"
                    title="Làm mới bộ lọc"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Product Cards Grid */}
            <div
              className={cn(
                'grid gap-6',
                layoutCols === 3
                  ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                  : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
              )}
            >
              {isLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs p-4 flex flex-col justify-between space-y-4 animate-pulse"
                  >
                    <div className="aspect-4/3 bg-slate-100 rounded-lg w-full" />
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-100 rounded w-1/3" />
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-100 rounded w-full" />
                    </div>
                    <div className="h-5 bg-slate-100 rounded w-1/2" />
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="h-4 bg-slate-200 rounded w-1/3" />
                      <div className="h-7 bg-slate-200 rounded w-20" />
                    </div>
                  </div>
                ))
              ) : products.length === 0 ? (
                <div className="col-span-full py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <PackageX className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-slate-800">Không tìm thấy sản phẩm phù hợp</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Không có sản phẩm nào khớp với bộ lọc của bạn. Hãy thử thay đổi thương hiệu hoặc khoảng giá.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              ) : (
                products.map((shoe) => {
                  const isLiked = likedShoes[shoe.id];
                  const availableSizes =
                    shoe.variants?.map((v) => v.sizeEu) || shoe.sizes || ['39', '40', '41', '42', '43'];
                  const activeCardSize =
                    selectedCardSizes[shoe.id] || shoe.defaultSize || availableSizes[0] || '42';
                  const isDeploying = addingId === shoe.id;
                  const shoePrice = shoe.price ?? shoe.minPrice ?? 0;
                  const shoeOriginalPrice = shoe.originalPrice ?? shoe.maxPrice ?? null;
                  const shoeImage =
                    shoe.image ||
                    shoe.defaultThumbnail ||
                    shoe.variants?.[0]?.thumbnailUrl ||
                    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80';
                  const shoeBrand = shoe.brand || shoe.brandName || 'SNEAKER';
                  const shoeCategory = shoe.category || shoe.categoryName || 'GIÀY THỂ THAO';
                  const shoeTag = shoe.tag || shoeBrand;
                  const shoeDispatch = shoe.dispatchId || shoe.code || `SKU-${shoe.id}`;
                  const shoeMatch = shoe.matchScore || '98%';
                  const shoeStatus = shoe.statusBadge || 'CHÍNH HÃNG';

                  return (
                    <div
                      key={shoe.id}
                      onClick={() => {
                        if (onSelectProduct) onSelectProduct(shoe);
                        navigate(`/product/${shoe.id}`);
                      }}
                      className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-slate-400 transition-all duration-300 flex flex-col cursor-pointer"
                    >
                      {/* Header Box: Dispatch Tag + Wishlist */}
                      <div className="relative aspect-4/3 bg-slate-50 flex items-center justify-center p-6 overflow-hidden">
                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
                          <span
                            className={cn(
                              'px-2 py-0.5 text-[9px] font-mono font-black uppercase tracking-wider rounded-xs shadow-xs',
                              shoe.tagType === 'red'
                                ? 'bg-red-600 text-white'
                                : 'bg-[#0A0A0A] text-white'
                            )}
                          >
                            {shoeTag}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 font-bold tracking-wider">
                            {shoeDispatch}
                          </span>
                        </div>

                        {/* Wishlist Heart */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLikedShoes((prev) => ({ ...prev, [shoe.id]: !prev[shoe.id] }));
                          }}
                          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/90 hover:bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-600 transition-all z-10 cursor-pointer"
                          aria-label="Yêu thích"
                        >
                          <Heart
                            className={cn('w-3.5 h-3.5', isLiked && 'fill-red-600 text-red-600')}
                          />
                        </button>

                        {/* Sneaker Image */}
                        <img
                          src={shoeImage}
                          alt={shoe.name}
                          className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-500 ease-out drop-shadow-md"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80';
                          }}
                        />

                        {/* Match Score Under Image */}
                        <div className="absolute bottom-2.5 inset-x-3 flex justify-center z-10">
                          <div className="px-2.5 py-0.5 rounded-xs bg-[#0A0A0A]/90 text-white text-[9px] font-mono font-bold tracking-wider flex items-center gap-1 shadow-xs border border-neutral-700">
                            <Sparkles className="w-2.5 h-2.5 text-red-500" />
                            <span>{shoeMatch} ĐỘ KHỚP AI</span>
                          </div>
                        </div>
                      </div>

                      {/* Meta Info */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white">
                        <div>
                          {/* Category + Status */}
                          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-mono">
                            <span className="text-slate-400 truncate max-w-[150px]">
                              {shoeCategory}
                            </span>
                            <span
                              className={cn(
                                'font-bold px-1.5 py-0.2 rounded-xs',
                                shoe.statusType === 'alert'
                                  ? 'text-red-600 bg-red-50'
                                  : 'text-slate-600 bg-slate-100'
                              )}
                            >
                              {shoeStatus}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight group-hover:text-red-600 transition-colors mt-1 line-clamp-1">
                            {shoe.name}
                          </h3>

                          {/* Description snippet */}
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 font-normal">
                            {shoe.description || 'Chất liệu cao cấp, độ bền vượt trội.'}
                          </p>
                        </div>

                        {/* Quick Size Selector */}
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-between text-[10px] font-mono pt-1"
                        >
                          <span className="text-slate-400 font-bold uppercase">CHỌN SIZE (EU):</span>
                          <div className="flex items-center gap-1">
                            {availableSizes.slice(0, 5).map((sz) => {
                              const isSzSelected = activeCardSize === sz;
                              return (
                                <button
                                  key={sz}
                                  type="button"
                                  onClick={() =>
                                    setSelectedCardSizes((prev) => ({ ...prev, [shoe.id]: sz }))
                                  }
                                  className={cn(
                                    'w-6 h-5 flex items-center justify-center font-bold text-[10px] rounded-xs border transition-all cursor-pointer',
                                    isSzSelected
                                      ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                                  )}
                                >
                                  {sz}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Price & Add to Cart Button */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div>
                            <div className="text-xs font-black text-red-600 font-mono">
                              {formatCurrency(shoePrice)}
                            </div>
                            {shoeOriginalPrice && (
                              <span className="text-[10px] text-slate-400 line-through font-mono">
                                {formatCurrency(shoeOriginalPrice)}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={(e) => handleDeploy(shoe, e)}
                            disabled={isDeploying}
                            className={cn(
                              'px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer',
                              isDeploying
                                ? 'bg-emerald-600 text-white'
                                : shoe.buttonType === 'red'
                                ? 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
                                : 'bg-[#0A0A0A] hover:bg-neutral-800 text-white'
                            )}
                          >
                            {isDeploying ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>ĐÃ THÊM</span>
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="w-3 h-3" />
                                <span>THÊM GIỎ</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination & Ledger Footer */}
            <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2 text-slate-500 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>HỆ THỐNG PHÂN PHỐI SNEAKER CHÍNH HÃNG NEWMOS</span>
              </div>

              <div className="flex items-center gap-2 font-mono">
                <button className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 rounded-lg bg-red-600 text-white font-bold">1</span>
                <button className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center text-slate-700 hover:border-black cursor-pointer">
                  2
                </button>
                <button className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center text-slate-700 hover:border-black cursor-pointer">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default ShopPage;
