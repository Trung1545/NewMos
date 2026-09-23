import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Flame,
  Search,
  ArrowLeft,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  AlertOctagon,
} from 'lucide-react';
import { productService } from '../services/productService';
import { formatCurrency } from '../lib/utils';

export function NotFoundPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [trendingProducts, setTrendingProducts] = useState([]);

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
          setTrendingProducts(list.slice(0, 4).map(normalize));
        } else {
          productService.getAllProducts({ pageSize: 4 }).then((allRes) => {
            const allList = allRes?.data?.content || allRes?.data || [];
            setTrendingProducts(allList.slice(0, 4).map(normalize));
          });
        }
      })
      .catch(() => {
        productService.getAllProducts({ pageSize: 4 }).then((allRes) => {
          const allList = allRes?.data?.content || allRes?.data || [];
          setTrendingProducts(allList.slice(0, 4).map(normalize));
        }).catch(() => {});
      });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="min-h-[80vh] bg-[#F9FAFB] py-12 sm:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Khối Hero 404 Sneaker Brutalist */}
        <div className="bg-[#0A0A0A] text-white rounded-xl p-8 sm:p-14 text-center relative overflow-hidden shadow-sm space-y-6">
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-red-600/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />

          {/* Typography 404 lớn */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <span className="text-7xl sm:text-9xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-neutral-300 to-neutral-700 select-none">
              4<span className="text-[#DC2626]">0</span>4
            </span>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/70 border border-red-500/30 text-red-400 text-xs font-mono font-bold uppercase -mt-4">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>LỖI ĐIỀU HƯỚNG // KHÔNG TÌM THẤY TRANG</span>
            </div>
          </div>

          <div className="relative z-10 max-w-xl mx-auto space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
              Đường Dẫn Này Không Tồn Tại Hoặc Đã Hết Hàng!
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Đôi sneaker hoặc trang bạn tìm kiếm dường như đã được dọn sạch khỏi kệ hoặc chuyển sang vị trí mới trong hệ thống NewMos.
            </p>
          </div>

          {/* Form tìm kiếm trực tiếp trong trang 404 */}
          <div className="relative z-10 max-w-md mx-auto">
            <form onSubmit={handleSearch} className="relative flex">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm giày theo tên, thương hiệu, màu sắc..."
                className="w-full pl-4 pr-10 py-3 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-[#DC2626] font-sans"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-md bg-[#DC2626] hover:bg-[#B91C1C] text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Các nút điều hướng nhanh */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/"
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-red-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay Về Trang Chủ</span>
            </Link>

            <Link
              to="/shop"
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Khám Phá Toàn Bộ Sneaker</span>
            </Link>
          </div>
        </div>

        {/* Sản phẩm thịnh hành gợi ý để giữ chân người dùng */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-[#DC2626] uppercase tracking-wider">
                GỢI Ý PHỔ BIẾN
              </span>
              <h2 className="text-xl font-black text-[#0A0A0A] uppercase mt-0.5">
                Các Mẫu Giày Đang Bán Chạy Nhất
              </h2>
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
            {trendingProducts.map((product) => (
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
                    <h3 className="text-sm font-bold text-[#0A0A0A] group-hover:text-[#DC2626] transition-colors line-clamp-1 mt-0.5">
                      {product.name}
                    </h3>
                  </div>
                  <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-sm font-black text-[#0A0A0A] font-mono">
                      {formatCurrency(product.price)}
                    </span>
                    <span className="text-xs font-bold text-[#DC2626] group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                      Xem ngay &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
