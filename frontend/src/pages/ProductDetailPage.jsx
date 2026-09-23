import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowLeft,
  ChevronDown,
  ShieldCheck,
  Truck,
  RotateCcw,
  Heart,
  Share2,
  ShoppingCart,
  Clock,
  Target,
  Cpu,
  PackageX,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { useCartStore } from '../stores/useCartStore';
import { useAIStore } from '../stores/useAIStore';
import { useChatbotStore } from '../stores/useChatbotStore';
import { useAuthStore } from '../stores/useAuthStore';
import { Toast } from '../components/common/Toast';
import { formatCurrency, cn } from '../lib/utils';
import { productService } from '../services/productService';
import { aiService } from '../services/aiService';
import { SizeGuideModal } from '../components/size/SizeGuideModal';
import { useProductStockWebSocket } from '../hooks/useProductStockWebSocket';

export function ProductDetailPage({
  product = null,
  onBack = null,
  onNavigateShop = null,
}) {
  const { id } = useParams();
  const navigate = useNavigate();

  const { addToCart, setIsOpen: setIsCartOpen } = useCartStore();
  const { setModalOpen, resetAI, recommendedSize, setRecommendedSize } = useAIStore();
  const { openChat } = useChatbotStore();
  const { isAuthenticated } = useAuthStore();
  const [aiRecommendation, setAiRecommendation] = useState(null);

  // Data fetching state
  const [productData, setProductData] = useState(product);
  const [isLoading, setIsLoading] = useState(!product);
  const [error, setError] = useState(null);

  // Interaction states
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState('42');
  const [sizeUnit, setSizeUnit] = useState('EU'); // 'EU' | 'US'
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [toast, setToast] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [flashVariantId, setFlashVariantId] = useState(null);

  // Accordion state
  const [openAccordions, setOpenAccordions] = useState({
    chassis: true,
    biometrics: false,
    security: false,
  });

  const toggleAccordion = (key) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Fetch product detail from Backend API
  useEffect(() => {
    let isMounted = true;

    const fetchDetail = async () => {
      // If a full product object was provided as prop and matches id
      if (product && (!id || String(product.id) === String(id))) {
        setProductData(product);
        setIsLoading(false);
        return;
      }

      const targetId = id || (product ? product.id : null);

      if (!targetId) {
        // Fallback: fetch first available product if no id in route
        try {
          setIsLoading(true);
          const res = await productService.getAllProducts({ pageSize: 1 });
          if (isMounted) {
            const list = res.data?.content || res.data || [];
            if (list.length > 0) {
              const detailRes = await productService.getProductById(list[0].id);
              const data = detailRes.data?.data || detailRes.data || list[0];
              setProductData(data);
            } else {
              setError('Không tìm thấy sản phẩm');
            }
          }
        } catch (err) {
          if (isMounted) {
            console.error('Lỗi khi tải sản phẩm mặc định:', err);
            setError('Không thể tải thông tin sản phẩm.');
          }
        } finally {
          if (isMounted) setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        const isNumeric = /^\d+$/.test(String(targetId));
        const res = isNumeric
          ? await productService.getProductById(targetId)
          : await productService.getProductBySlug(targetId);
        if (isMounted) {
          const data =
            (res.data && res.data.id ? res.data : null) ||
            (res.id ? res : null) ||
            res.data?.data ||
            res.data ||
            res;
          if (data) {
            setProductData(data);
          } else {
            setError('Không tìm thấy sản phẩm.');
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error(`Lỗi khi tải chi tiết sản phẩm ID ${targetId}:`, err);
          setError('Không tìm thấy sản phẩm hoặc lỗi kết nối máy chủ.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [id, product]);

  // Lọc danh sách các biến thể size còn hàng (stock_quantity > 0 hoặc inStock)
  const variants = productData?.variants || [];
  const inStockVariants = variants.filter((v) => {
    const stock = v.stockQuantity ?? v.stock_quantity;
    return stock !== undefined && stock !== null ? Number(stock) > 0 : v.inStock !== false;
  });

  // Tự động chọn biến thể còn hàng đầu tiên khi dữ liệu sản phẩm cập nhật
  useEffect(() => {
    if (variants.length > 0) {
      const match = variants.find(
        (v) =>
          (v.sizeEu || v.sizeUs) === selectedSize &&
          (v.stockQuantity ?? v.stock_quantity ?? 1) > 0
      );
      if (match) {
        setSelectedVariant(match);
      } else {
        const firstInStock = inStockVariants[0] || variants[0];
        setSelectedVariant(firstInStock);
        setSelectedSize(firstInStock.sizeEu || firstInStock.sizeUs || '42');
      }
    }
  }, [productData]);

  // Cập nhật khi AI gợi ý size
  useEffect(() => {
    if (recommendedSize && variants.length > 0) {
      const matched = variants.find(
        (v) => (v.sizeEu || v.sizeUs) === String(recommendedSize)
      );
      if (matched) {
        setSelectedSize(String(recommendedSize));
        setSelectedVariant(matched);
      }
    }
  }, [recommendedSize, variants]);

  // Tự động tải gợi ý size AI cho sản phẩm này theo hồ sơ tài khoản người dùng
  useEffect(() => {
    if (productData?.id) {
      aiService.recommendProductSize(productData.id)
        .then((res) => {
          const rec = res?.data || res;
          if (rec?.recommendedSizeEu) {
            setAiRecommendation(rec);
            setRecommendedSize(rec.recommendedSizeEu);
          }
        })
        .catch(() => {});
    }
  }, [productData?.id, isAuthenticated, setRecommendedSize]);

  // Lắng nghe cập nhật tồn kho theo thời gian thực qua WebSocket & STOMP
  useProductStockWebSocket(productData?.id, (stockUpdate) => {
    if (!stockUpdate || !stockUpdate.variantId) return;

    const targetVariantId = stockUpdate.variantId;
    const targetSize = String(stockUpdate.size);
    const newStock = stockUpdate.remainingStock ?? 0;
    const isOut = stockUpdate.isOutOfStock || newStock <= 0;

    // 1. Cập nhật trực tiếp số lượng tồn kho của biến thể trong productData
    setProductData((prev) => {
      if (!prev || !prev.variants) return prev;
      const updatedVariants = prev.variants.map((v) => {
        if (v.id === targetVariantId || String(v.sizeEu) === targetSize) {
          return {
            ...v,
            stockQuantity: newStock,
            stock_quantity: newStock,
            inStock: !isOut,
          };
        }
        return v;
      });
      return { ...prev, variants: updatedVariants };
    });

    // 2. Kích hoạt hiệu ứng flash viền trong 1 giây tại ô size vừa cập nhật
    setFlashVariantId(targetVariantId);
    setTimeout(() => {
      setFlashVariantId((prev) => (prev === targetVariantId ? null : prev));
    }, 1200);

    // 3. Nếu người dùng đang chọn đúng size này mà size bị hết hàng (remainingStock === 0)
    if (isOut && (selectedVariant?.id === targetVariantId || String(selectedSize) === targetSize)) {
      setToast({
        title: 'THÔNG BÁO TỒN KHO THỜI GIAN THỰC',
        message: `Size ${targetSize} bạn vừa chọn đã hết hàng do khách khác vừa thanh toán!`,
        isError: true,
      });
      setSelectedVariant(null);
      setSelectedSize(null);
    } else if (selectedVariant?.id === targetVariantId) {
      setSelectedVariant((prev) => (prev ? { ...prev, stockQuantity: newStock, stock_quantity: newStock, inStock: !isOut } : null));
    }
  });

  // Xử lý danh sách hình ảnh thật
  const rawImages = [
    ...(selectedVariant?.images || []),
    ...(selectedVariant?.thumbnailUrl ? [selectedVariant.thumbnailUrl] : []),
    ...(productData?.variants?.flatMap((v) => v.images || []) || []),
    productData?.defaultThumbnail,
    productData?.image,
    ...(productData?.images || []),
  ].filter(Boolean);

  const imagesList = Array.from(new Set(rawImages));
  if (imagesList.length === 0) {
    imagesList.push(
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80'
    );
  }

  // Giá bán & Giá gốc an toàn
  const currentPrice =
    selectedVariant?.price ?? productData?.minPrice ?? productData?.price ?? 0;
  const originalPrice =
    selectedVariant?.originalPrice ?? productData?.maxPrice ?? productData?.originalPrice ?? null;

  const rawPrice = currentPrice < 10000 ? currentPrice * 25000 : currentPrice;
  const rawOriginalPrice = originalPrice
    ? originalPrice < 10000
      ? originalPrice * 25000
      : originalPrice
    : null;

  const handleSelectSize = (variant) => {
    setSelectedVariant(variant);
    setSelectedSize(variant.sizeEu || variant.sizeUs);
  };

  const handleApplySizeGuide = (size) => {
    const sizeStr = String(size);
    setSelectedSize(sizeStr);
    setRecommendedSize(sizeStr);

    if (variants.length > 0) {
      const match =
        variants.find(
          (v) =>
            (String(v.sizeEu) === sizeStr || String(v.sizeUs) === sizeStr) &&
            (v.stockQuantity ?? v.stock_quantity ?? 1) > 0
        ) ||
        variants.find(
          (v) => String(v.sizeEu) === sizeStr || String(v.sizeUs) === sizeStr
        );

      if (match) {
        setSelectedVariant(match);
      }
    }

    setToast({
      title: 'ĐÃ CHỌN SIZE THEO HƯỚNG DẪN',
      message: `Đã áp dụng kích thước vừa vặn nhất: Size ${sizeStr} ${sizeUnit}`,
    });
  };

  const handleAddToCart = () => {
    if (!productData) return;
    setIsAdding(true);

    const mainImage = imagesList[0] || productData.defaultThumbnail || '';
    const activeSize = selectedSize || selectedVariant?.sizeEu || selectedVariant?.sizeUs || '42';

    addToCart(
      {
        id: String(productData.id),
        variantId: selectedVariant?.id,
        sku: selectedVariant?.sku || undefined,
        name: productData.name,
        price: rawPrice,
        image: mainImage,
        color: selectedVariant?.color || productData.categoryName || 'Bản Tiêu Chuẩn',
        brand: productData.brandName || productData.brand || 'NewMos',
        quantity: quantity,
      },
      activeSize
    );

    setToast({
      title: 'ĐÃ THÊM VÀO GIỎ HÀNG THÀNH CÔNG',
      message: `${productData.name} (Size ${activeSize} ${sizeUnit}) x ${quantity}`,
      image: mainImage,
    });

    setTimeout(() => {
      setIsAdding(false);
      setIsCartOpen(true);
    }, 400);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (onNavigateShop) {
      onNavigateShop();
    } else {
      navigate('/shop');
    }
  };

  // 1. SKELETON LOADING STATE
  if (isLoading) {
    return (
      <div className="bg-white text-slate-900 min-h-screen font-sans">
        <div className="border-b border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="h-4 bg-slate-200 rounded w-48 animate-pulse" />
            <div className="h-4 bg-slate-200 rounded w-32 animate-pulse hidden sm:block" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            {/* Left Image Skeleton */}
            <div className="lg:col-span-7 space-y-4">
              <div className="aspect-4/3 rounded-2xl bg-slate-100 border border-slate-200 animate-pulse flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-slate-200" />
              </div>
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="aspect-4/3 rounded-xl bg-slate-100 border border-slate-200 animate-pulse"
                  />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200">
                <div className="h-16 bg-slate-50 rounded-lg animate-pulse" />
                <div className="h-16 bg-slate-50 rounded-lg animate-pulse" />
                <div className="h-16 bg-slate-50 rounded-lg animate-pulse" />
              </div>
            </div>

            {/* Right Spec Skeleton */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/3 animate-pulse" />
                <div className="h-8 bg-slate-200 rounded w-3/4 animate-pulse" />
                <div className="h-7 bg-slate-200 rounded w-1/2 animate-pulse" />
              </div>
              <div className="h-16 bg-slate-100 rounded-lg animate-pulse" />
              <div className="h-28 bg-slate-900/10 rounded-xl animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/4 animate-pulse" />
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              </div>
              <div className="h-12 bg-red-600/30 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. ERROR / NOT FOUND STATE
  if (!productData || error) {
    return (
      <div className="bg-white text-slate-900 min-h-screen font-sans flex flex-col justify-center items-center px-4 py-20">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-4 border border-red-100">
          <PackageX className="w-8 h-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
          Không tìm thấy sản phẩm
        </h2>
        <p className="text-slate-500 text-sm mt-2 max-w-md text-center leading-relaxed">
          {error || 'Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã ngừng kinh doanh trên hệ thống NewMos.'}
        </p>
        <button
          onClick={handleBack}
          className="mt-6 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm cursor-pointer transition-all flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh mục sản phẩm</span>
        </button>
      </div>
    );
  }

  // 3. MAIN PRODUCT DETAIL VIEW
  const shoeBrand = productData.brandName || productData.brand || 'NEWMOS';
  const shoeCategory = productData.categoryName || productData.category || 'SNEAKER';
  const shoeTag = productData.tag || (productData.isFeatured ? 'HOT' : 'CHÍNH HÃNG');
  const shoeDispatch = productData.code || productData.dispatchId || `SKU-#${productData.id}`;
  const stockCount = selectedVariant?.stockQuantity ?? selectedVariant?.stock_quantity ?? productData.stockCount;
  const isOutOfStock = inStockVariants.length === 0 && variants.length > 0;

  return (
    <div className="bg-white text-slate-900 min-h-screen font-sans">
      {/* 1. Breadcrumbs & Telemetry Status */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-500">
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-slate-800 hover:text-red-600 font-bold uppercase transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>QUAY LẠI CỬA HÀNG</span>
            </button>
            <span>/</span>
            <span className="text-slate-500 uppercase">{shoeBrand}</span>
            <span>/</span>
            <span className="text-slate-900 font-bold uppercase truncate max-w-[200px]">
              {productData.name}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              <span className="text-red-600 font-bold uppercase tracking-wider">
                HỆ THỐNG HIỆU CHUẨN AI ĐANG HOẠT ĐỘNG
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>ĐỘ TRỄ: 8MS // 60 FPS</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main PDP Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* ================= LEFT: IMAGE GALLERY (7 cols) ================= */}
          <div className="lg:col-span-7 space-y-4">
            {/* Main Stage Image Box */}
            <div className="relative aspect-4/3 rounded-2xl bg-slate-50 border border-slate-200 p-8 flex items-center justify-center overflow-hidden group shadow-xs">
              {/* Badges Top Left */}
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
                <span className="px-2.5 py-1 text-[10px] font-mono font-black uppercase tracking-wider bg-red-600 text-white rounded-xs shadow-xs">
                  {shoeTag}
                </span>
                <span className="text-[10px] font-mono text-slate-400 font-bold tracking-wider">
                  {shoeDispatch}
                </span>
              </div>

              {/* Wishlist & Share Top Right */}
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className="w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-600 transition-all cursor-pointer"
                  title="Lưu sản phẩm yêu thích"
                  aria-label="Yêu thích"
                >
                  <Heart className={cn('w-4 h-4', isLiked && 'fill-red-600 text-red-600')} />
                </button>
                <button
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(window.location.href);
                    }
                    setToast({
                      title: 'ĐÃ SAO CHÉP LIÊN KẾT',
                      message: 'Đã lưu đường dẫn sản phẩm vào bộ nhớ tạm.',
                    });
                  }}
                  className="w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-500 hover:text-black transition-all cursor-pointer"
                  title="Chia sẻ sản phẩm"
                  aria-label="Chia sẻ"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              {/* Main Image */}
              <img
                src={imagesList[selectedImageIndex] || imagesList[0]}
                alt={productData.name}
                className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-700 ease-out drop-shadow-xl relative z-10"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80';
                }}
              />

              {/* Telemetry Match Tag */}
              <div className="absolute bottom-4 inset-x-4 flex justify-center z-10">
                <div className="px-3.5 py-1 rounded-sm bg-[#0A0A0A]/90 text-white text-[11px] font-mono font-bold tracking-wider flex items-center gap-2 shadow-md border border-neutral-700">
                  <Sparkles className="w-3.5 h-3.5 text-red-500" />
                  <span>
                    FORM GIÀY: CHUẨN FORM CHÂU Á // VỪA VẶN HOÀN HẢO
                  </span>
                </div>
              </div>
            </div>

            {/* Thumbnail Row */}
            {imagesList.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {imagesList.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={cn(
                      'relative aspect-4/3 rounded-xl overflow-hidden bg-slate-50 border p-2 transition-all cursor-pointer',
                      selectedImageIndex === idx
                        ? 'border-red-600 ring-2 ring-red-600/30 shadow-sm'
                        : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                    )}
                  >
                    <img
                      src={img}
                      alt={`Góc nhìn ${idx + 1}`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* 3 Trust Signals */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200 text-center text-xs text-slate-500">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <ShieldCheck className="w-4 h-4 text-slate-800 mx-auto mb-1" />
                <span className="font-bold text-slate-900 block">XÁC THỰC NFC</span>
                <span className="text-[11px]">Chính hãng 100%</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <Truck className="w-4 h-4 text-red-600 mx-auto mb-1" />
                <span className="font-bold text-slate-900 block">GIAO SIÊU TỐC</span>
                <span className="text-[11px]">Nhận hàng trong 24h</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <RotateCcw className="w-4 h-4 text-slate-800 mx-auto mb-1" />
                <span className="font-bold text-slate-900 block">ĐỔI SIZE DỄ DÀNG</span>
                <span className="text-[11px]">Đổi trả 30 ngày</span>
              </div>
            </div>
          </div>

          {/* ================= RIGHT: SPECIFICATION & BUY BOX (5 cols) ================= */}
          <div className="lg:col-span-5 space-y-6">
            {/* Header / Series / Title */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-400">
                <span>{productData.series || `${shoeCategory} // CHÍNH HÃNG`}</span>
                <span className="text-red-600 font-bold">
                  {stockCount !== undefined && stockCount !== null
                    ? `CÒN LẠI ${stockCount} ĐÔI`
                    : isOutOfStock
                    ? 'TẠM HẾT HÀNG'
                    : 'CÒN HÀNG'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-slate-950 mt-1">
                {productData.name}
              </h1>

              {/* Price Row */}
              <div className="flex items-baseline gap-3 mt-3 font-mono">
                <span className="text-3xl font-black text-red-600 tracking-tight">
                  {formatCurrency(rawPrice)}
                </span>
                {rawOriginalPrice && (
                  <span className="text-sm text-slate-400 line-through">
                    {formatCurrency(rawOriginalPrice)}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-xs bg-red-50 text-red-600 text-xs font-bold">
                  ĐÃ CÓ VAT // FREESHIP TOÀN QUỐC
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              {productData.description ||
                'Mẫu giày thể thao chất lượng cao với công nghệ đệm êm ái, bám sàn vượt trội và độ hoàn thiện tinh tế.'}
            </p>

            {/* Nút / Badge Nổi bật Đỏ Thể thao Kích hoạt Chatbot Tư Vấn Size NewMos AI */}
            <button
              type="button"
              onClick={() => {
                const context = {
                  id: productData?.id,
                  name: productData?.name,
                  price: rawPrice,
                  imageUrl: displayImages?.[0] || productData?.thumbnail || null,
                  slug: productData?.slug,
                };
                openChat(
                  `Chào NewMos AI, mình muốn tư vấn chọn size cho mẫu ${productData?.name || 'giày này'}. Bạn hướng dẫn mình cách chọn size chuẩn nhé!`,
                  context
                );
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-[#DC2626] to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-between shadow-lg shadow-red-600/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <span className="text-base animate-pulse">💬</span>
                <span className="text-left font-sans font-bold">Cần tư vấn size? Chat với NewMos AI</span>
              </div>
              <span className="text-[10px] font-mono bg-white/20 px-2.5 py-1 rounded text-white group-hover:bg-white group-hover:text-red-600 font-black transition-colors shrink-0">
                CHAT NGAY
              </span>
            </button>

            {/* AI Sizing Box */}
            <div className="p-4 rounded-xl bg-[#0A0A0A] text-white border border-neutral-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    GỢI Ý KÍCH THƯỚC TỪ TRỢ LÝ NEWMOS AI
                  </span>
                </div>
                <span className="px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-mono font-bold rounded">
                  {shoeBrand} FIT
                </span>
              </div>

              <p className="text-[11px] text-neutral-300 leading-relaxed">
                {recommendedSize ? (
                  <>
                    Thuật toán AI đối chiếu form giày <strong className="text-white">{shoeBrand}</strong> với bàn chân bạn: Đề xuất size{' '}
                    <strong className="text-red-400 font-black text-xs">EU {recommendedSize}</strong>.
                    {aiRecommendation?.fittingAdvice ? ` ${aiRecommendation.fittingAdvice}` : ' Đảm bảo độ ôm chuẩn xác và thoải mái tối ưu ngón chân.'}
                  </>
                ) : (
                  <>
                    Trợ lý NewMos AI hỗ trợ đối chiếu thông số chiều dài và dáng bàn chân của bạn theo thời gian thực để gợi ý size giày chuẩn xác theo khuôn giày {shoeBrand}.
                  </>
                )}
              </p>
            </div>

            {/* Nút link thể thao: Hướng dẫn đo chân & tính size chuẩn */}
            <div className="flex items-center justify-between pb-1">
              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-black text-[#DC2626] hover:text-[#B91C1C] hover:underline cursor-pointer transition-colors group"
              >
                <span>📏 Hướng dẫn đo chân & tính size chuẩn</span>
                <span className="text-[10px] font-mono bg-red-100 text-[#DC2626] px-1.5 py-0.5 rounded font-black group-hover:bg-red-200 transition-colors">
                  AI FIT
                </span>
              </button>
            </div>

            {/* Size Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono uppercase">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 tracking-wider">CHỌN SIZE CÒN HÀNG:</span>
                  {selectedVariant?.stockQuantity !== undefined && (
                    <span className="text-slate-400 text-[10px]">
                      (Kho: {selectedVariant.stockQuantity} đôi)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-xs text-[10px]">
                    <button
                      type="button"
                      onClick={() => setSizeUnit('EU')}
                      className={cn(
                        'px-2 py-0.5 rounded-xs font-bold transition-all cursor-pointer',
                        sizeUnit === 'EU' ? 'bg-[#0A0A0A] text-white' : 'text-slate-500'
                      )}
                    >
                      EU
                    </button>
                    <button
                      type="button"
                      onClick={() => setSizeUnit('US')}
                      className={cn(
                        'px-2 py-0.5 rounded-xs font-bold transition-all cursor-pointer',
                        sizeUnit === 'US' ? 'bg-[#0A0A0A] text-white' : 'text-slate-500'
                      )}
                    >
                      US
                    </button>
                  </div>
                </div>
              </div>

              {/* Sizes Grid */}
              {variants.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {variants.map((variant) => {
                    const sizeVal = sizeUnit === 'US' ? variant.sizeUs || variant.sizeEu : variant.sizeEu;
                    const stock = variant.stockQuantity ?? variant.stock_quantity ?? (variant.inStock ? 1 : 0);
                    const isVariantOutOfStock = stock <= 0;
                    const isSelected =
                      (selectedSize === variant.sizeEu || selectedSize === variant.sizeUs) && !isVariantOutOfStock;
                    const isRecommended = Boolean(
                      recommendedSize &&
                      (String(recommendedSize) === String(variant.sizeEu) || String(recommendedSize) === String(variant.sizeUs))
                    );
                    const isFlashing = flashVariantId === variant.id;

                    return (
                      <button
                        key={variant.id || variant.sku || sizeVal}
                        type="button"
                        disabled={isVariantOutOfStock}
                        onClick={() => {
                          if (!isVariantOutOfStock) {
                            handleSelectSize(variant);
                          }
                        }}
                        title={
                          isVariantOutOfStock
                            ? `Size ${sizeVal} (Đã hết hàng)`
                            : isRecommended
                            ? `Size ${sizeVal} (AI Khuyên Dùng - Còn ${stock} đôi)`
                            : `Size ${sizeVal} (Còn ${stock} đôi)`
                        }
                        className={cn(
                          'py-2.5 text-center font-mono text-xs font-bold rounded-lg border transition-all relative flex flex-col items-center justify-center gap-0.5 select-none overflow-visible',
                          isFlashing && 'ring-4 ring-amber-400 border-amber-500 scale-105 shadow-md shadow-amber-500/30 z-10 transition-transform duration-300',
                          isVariantOutOfStock
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60 after:content-[""] after:absolute after:inset-0 after:m-auto after:h-[1.5px] after:w-full after:bg-slate-400 after:rotate-[-25deg]'
                            : isSelected
                            ? isRecommended
                              ? 'bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-500/50 cursor-pointer'
                              : 'bg-red-600 text-white border-red-600 shadow-sm cursor-pointer'
                            : isRecommended
                            ? 'border-2 border-[#DC2626] bg-red-50 text-[#DC2626] font-black shadow-xs ring-1 ring-red-500/30 cursor-pointer hover:bg-red-100'
                            : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-400 cursor-pointer'
                        )}
                      >
                        {/* Tag AI Khuyên Dùng */}
                        {isRecommended && !isVariantOutOfStock && (
                          <span className="absolute -top-2.5 inset-x-0 mx-auto w-max px-1.5 py-0.2 bg-[#DC2626] text-white text-[8px] font-mono font-black uppercase rounded shadow-xs z-20 animate-pulse">
                            AI KHUYÊN DÙNG
                          </span>
                        )}
                        <span className={cn('text-xs font-bold', isVariantOutOfStock && 'line-through')}>
                          {sizeVal}
                        </span>
                        {isVariantOutOfStock ? (
                          <span className="text-[8px] font-normal leading-none text-slate-400">
                            Hết hàng
                          </span>
                        ) : stock > 0 && stock <= 5 ? (
                          <span
                            className={cn(
                              'text-[9px] font-normal leading-none',
                              isSelected ? 'text-white/80' : 'text-red-500'
                            )}
                          >
                            Còn {stock}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {['39', '40', '41', '42', '43', '44'].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={cn(
                        'py-2 text-center font-mono text-xs font-bold rounded-lg border transition-all cursor-pointer',
                        selectedSize === sz
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-slate-50 text-slate-800 border-slate-200'
                      )}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quantity Selector + Deploy Button */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-slate-300 rounded-lg bg-slate-50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-9 h-10 flex items-center justify-center text-slate-600 hover:text-black font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-mono font-bold text-sm text-slate-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-9 h-10 flex items-center justify-center text-slate-600 hover:text-black font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Primary Buy CTA Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={
                    isAdding ||
                    isOutOfStock ||
                    ((selectedVariant?.stockQuantity ?? selectedVariant?.stock_quantity ?? 1) <= 0 && variants.length > 0)
                  }
                  className={cn(
                    'flex-1 py-3.5 px-6 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all duration-200 active:scale-98 cursor-pointer',
                    isOutOfStock ||
                      ((selectedVariant?.stockQuantity ?? selectedVariant?.stock_quantity ?? 1) <= 0 && variants.length > 0)
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : isAdding
                      ? 'bg-emerald-600 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30'
                  )}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>
                    {isOutOfStock ||
                    ((selectedVariant?.stockQuantity ?? selectedVariant?.stock_quantity ?? 1) <= 0 && variants.length > 0)
                      ? 'SIZE NÀY ĐÃ HẾT HÀNG'
                      : isAdding
                      ? 'ĐANG THÊM VÀO GIỎ HÀNG...'
                      : `THÊM VÀO GIỎ // ${formatCurrency(rawPrice * quantity)}`}
                  </span>
                </button>
              </div>
            </div>

            {/* Technical Accordions */}
            <div className="space-y-2 pt-4 border-t border-slate-200 text-xs">
              {/* Accordion 1: Chassis */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleAccordion('chassis')}
                  className="w-full p-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between font-bold text-slate-900 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-red-600" />
                    <span>01 // CÔNG NGHỆ ĐỆM & VẬT LIỆU CHẾ TÁC</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-3.5 h-3.5 transition-transform duration-200',
                      openAccordions.chassis ? 'rotate-180' : ''
                    )}
                  />
                </button>
                {openAccordions.chassis && (
                  <div className="p-3 text-[11px] text-slate-600 leading-relaxed bg-white border-t border-slate-200">
                    {productData.material
                      ? `Vật liệu hoàn thiện: ${productData.material}. `
                      : ''}
                    Hệ thống đệm khí nén phản hồi lực linh hoạt, hỗ trợ bảo vệ mắt cá chân và khớp gối khi vận động cường độ cao.
                  </div>
                )}
              </div>

              {/* Accordion 2: Biometrics */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleAccordion('biometrics')}
                  className="w-full p-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between font-bold text-slate-900 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Target className="w-3.5 h-3.5 text-red-600" />
                    <span>02 // CHẤT LIỆU THÂN GIÀY & ĐỘ THOÁNG KHÍ</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-3.5 h-3.5 transition-transform duration-200',
                      openAccordions.biometrics ? 'rotate-180' : ''
                    )}
                  />
                </button>
                {openAccordions.biometrics && (
                  <div className="p-3 text-[11px] text-slate-600 leading-relaxed bg-white border-t border-slate-200">
                    Chất liệu da và vải lưới dệt cao cấp gia cố nhiệt tại các vị trí chịu lực ở mũi và gót. Khả năng tản nhiệt tối đa, thích ứng linh hoạt theo độ co giãn của bàn chân.
                  </div>
                )}
              </div>

              {/* Accordion 3: Security & NFC */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleAccordion('security')}
                  className="w-full p-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between font-bold text-slate-900 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
                    <span>03 // CHIP XÁC THỰC NFC CHỐNG HÀNG GIẢ</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-3.5 h-3.5 transition-transform duration-200',
                      openAccordions.security ? 'rotate-180' : ''
                    )}
                  />
                </button>
                {openAccordions.security && (
                  <div className="p-3 text-[11px] text-slate-600 leading-relaxed bg-white border-t border-slate-200">
                    Mỗi đôi giày xuất xưởng đều được tích hợp chip mã hóa NFC bên trong lót giày. Chạm nhẹ điện thoại để kiểm tra mã SKU chính hãng và kích hoạt bảo hành điện tử 12 tháng.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        onApplySize={handleApplySizeGuide}
        shoeModel={productData?.code || 'RUNNER_PRO'}
        shoeName={productData?.name || 'NewMos Runner Pro'}
        currentSize={selectedSize}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

export default ProductDetailPage;
