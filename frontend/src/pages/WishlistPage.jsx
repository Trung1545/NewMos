import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  ShoppingBag,
  Trash2,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { useCartStore } from '../stores/useCartStore';
import { useAIStore } from '../stores/useAIStore';
import { productService } from '../services/productService';
import { formatCurrency } from '../lib/utils';

export function WishlistPage() {
  const navigate = useNavigate();
  const { addToCart, setIsOpen } = useCartStore();
  const { recommendedSize } = useAIStore();

  const [wishlistItems, setWishlistItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSizes, setSelectedSizes] = useState({});

  const normalizeProduct = (p) => ({
    id: p.id,
    name: p.name,
    brand: p.brandName || p.brand || 'NewMos',
    category: p.categoryName || p.category || 'SNEAKER',
    price: p.minPrice ? Number(p.minPrice) : (p.price || 0),
    originalPrice: p.maxPrice && Number(p.maxPrice) > (p.minPrice ? Number(p.minPrice) : 0) ? Number(p.maxPrice) : null,
    image: p.defaultThumbnail || p.image || p.variants?.[0]?.thumbnailUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80',
    color: p.variants?.[0]?.color || p.color || 'Bản Tiêu Chuẩn',
    sizes: p.sizes || p.variants?.map((v) => v.sizeEu) || ['39', '40', '41', '42', '43', '44'],
    defaultSize: p.variants?.[0]?.sizeEu || '42',
    variants: p.variants || [],
  });

  // Nạp danh sách sản phẩm yêu thích từ Database theo danh sách ID lưu trong localStorage
  useEffect(() => {
    let isMounted = true;
    const fetchWishlist = async () => {
      setIsLoading(true);
      try {
        const saved = localStorage.getItem('newmos_wishlist') || localStorage.getItem('kicks_wishlist');
        const savedIds = saved ? JSON.parse(saved) : [];

        const res = await productService.getAllProducts({ pageSize: 50 });
        const all =
          res?.data?.content ||
          (Array.isArray(res?.data) ? res.data : []) ||
          (Array.isArray(res) ? res : []) ||
          [];

        const normalizedList = all.map(normalizeProduct);

        if (isMounted) {
          if (savedIds.length > 0) {
            const filtered = normalizedList.filter((p) =>
              savedIds.map(String).includes(String(p.id))
            );
            setWishlistItems(filtered);
          } else {
            // Nếu chưa từng lưu, hiển thị 3 sản phẩm nổi bật ban đầu từ Database
            setWishlistItems(normalizedList.slice(0, 3));
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách yêu thích:', err);
        if (isMounted) setWishlistItems([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchWishlist();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    try {
      const ids = wishlistItems.map((item) => item.id);
      localStorage.setItem('newmos_wishlist', JSON.stringify(ids));
    } catch {
      // Ignore
    }
  }, [wishlistItems]);

  const handleRemoveFromWishlist = (productId) => {
    setWishlistItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const handleClearAll = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách yêu thích?')) {
      setWishlistItems([]);
    }
  };

  const handleSelectSize = (productId, size) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }));
  };

  const handleAddToCart = (product) => {
    const size = selectedSizes[product.id] || recommendedSize || product.defaultSize || '42';
    const matchedVariant = product.variants?.find((v) => String(v.sizeEu) === String(size)) || product.variants?.[0];

    addToCart(
      {
        id: String(product.id),
        variantId: matchedVariant?.id,
        sku: matchedVariant?.sku,
        name: product.name,
        price: matchedVariant?.price ? Number(matchedVariant.price) : product.price,
        image: matchedVariant?.thumbnailUrl || product.image,
        color: matchedVariant?.color || product.color,
        brand: product.brand,
      },
      size
    );
    setIsOpen(true);
  };

  const handleAddAllToCart = () => {
    wishlistItems.forEach((product) => {
      const size = selectedSizes[product.id] || recommendedSize || product.defaultSize || '42';
      const matchedVariant = product.variants?.find((v) => String(v.sizeEu) === String(size)) || product.variants?.[0];

      addToCart(
        {
          id: String(product.id),
          variantId: matchedVariant?.id,
          sku: matchedVariant?.sku,
          name: product.name,
          price: matchedVariant?.price ? Number(matchedVariant.price) : product.price,
          image: matchedVariant?.thumbnailUrl || product.image,
          color: matchedVariant?.color || product.color,
          brand: product.brand,
        },
        size
      );
    });
    setIsOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-neutral-500 font-sans">
          <Link to="/" className="hover:text-[#DC2626] transition-colors">
            Trang chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#0A0A0A] font-bold">Danh sách yêu thích ({wishlistItems.length})</span>
        </nav>

        {/* Tiêu đề & Nút thao tác */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black uppercase text-[#0A0A0A] tracking-tight">
                Sản Phẩm Yêu Thích
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#DC2626] text-white text-xs font-bold font-mono">
                {wishlistItems.length} MẪU
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1 font-sans">
              Lưu giữ những đôi sneaker bạn muốn sở hữu và thêm nhanh vào giỏ bất cứ khi nào sẵn sàng.
            </p>
          </div>

          {wishlistItems.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddAllToCart}
                className="px-4 py-2.5 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-red-600/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Thêm Tất Cả Vào Giỏ</span>
              </button>

              <button
                onClick={handleClearAll}
                className="px-3.5 py-2.5 rounded-lg border border-neutral-200 hover:border-red-200 bg-white text-neutral-500 hover:text-[#DC2626] text-xs font-bold transition-colors cursor-pointer"
                title="Xóa toàn bộ"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {wishlistItems.length === 0 ? (
          /* TRƯỜNG HỢP EMPTY STATE */
          <div className="bg-white rounded-xl border border-neutral-200 p-8 sm:p-14 text-center max-w-xl mx-auto shadow-xs space-y-5">
            <div className="w-20 h-20 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-[#DC2626]">
              <Heart className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-[#0A0A0A] uppercase">
                Danh Sách Yêu Thích Trống
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto leading-relaxed">
                Bạn chưa lưu mẫu giày nào. Nhấn vào biểu tượng trái tim khi lướt xem các mẫu giày để lưu vào danh sách này nhé!
              </p>
            </div>

            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-red-600/20 transition-all cursor-pointer"
            >
              <Flame className="w-4 h-4" />
              <span>Khám Phá Bộ Sưu Tập Giày</span>
            </Link>
          </div>
        ) : (
          /* LƯỚI CARD SẢN PHẨM YÊU THÍCH */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((product) => {
              const currentSize = selectedSizes[product.id] || recommendedSize || product.defaultSize || '42';

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group relative"
                >
                  {/* Nút Xóa Yêu Thích */}
                  <button
                    onClick={() => handleRemoveFromWishlist(product.id)}
                    className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#DC2626] border border-neutral-200 shadow-xs flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                    title="Bỏ khỏi yêu thích"
                  >
                    <Heart className="w-4 h-4 fill-[#DC2626]" />
                  </button>

                  {/* Thumbnail Ảnh Giày */}
                  <Link
                    to={`/product/${product.id}`}
                    className="relative aspect-square bg-neutral-50 p-6 flex items-center justify-center overflow-hidden block"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded-sm bg-[#0A0A0A] text-white text-[10px] font-mono font-bold uppercase">
                      {product.brand}
                    </span>

                    {product.matchScore && (
                      <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-sm bg-red-50 text-[#DC2626] border border-red-200 text-[10px] font-mono font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        AI: {product.matchScore}
                      </span>
                    )}
                  </Link>

                  {/* Chi tiết nội dung */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[10px] font-mono font-semibold uppercase text-neutral-500">
                        {product.category}
                      </span>
                      <Link
                        to={`/product/${product.id}`}
                        className="block text-sm font-bold text-[#0A0A0A] group-hover:text-[#DC2626] transition-colors line-clamp-1 mt-0.5"
                      >
                        {product.name}
                      </Link>
                      <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                        {product.color}
                      </p>
                    </div>

                    {/* Chọn Size */}
                    <div className="pt-2 border-t border-neutral-100">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-neutral-600 uppercase">
                          Chọn Size:
                        </span>
                        <span className="text-[11px] font-mono font-bold text-[#DC2626]">
                          EU {currentSize}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {product.sizes?.slice(0, 6).map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => handleSelectSize(product.id, sz)}
                            className={`px-2 py-1 text-[11px] font-mono font-bold rounded-sm border transition-colors cursor-pointer ${
                              String(currentSize) === String(sz)
                                ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                                : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Giá & Nút Thêm Vào Giỏ */}
                    <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-base font-black text-[#0A0A0A] font-mono">
                          {formatCurrency(product.price)}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-[11px] text-neutral-400 line-through font-mono block">
                            {formatCurrency(product.originalPrice)}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleAddToCart(product)}
                        className="px-3 py-2 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold uppercase tracking-wider shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Thêm Giỏ</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default WishlistPage;
