import { useState, useEffect } from 'react';
import {
  X,
  ShoppingBag,
  Sparkles,
  Plus,
  Minus,
  ShieldCheck,
  CheckCircle2,
  Truck,
  RotateCcw,
  Flame,
} from 'lucide-react';
import { useCartStore } from '../../stores/useCartStore';
import { useAIStore } from '../../stores/useAIStore';
import { cn } from '../../lib/utils';

export function QuickViewModal({ product, isOpen, onClose, onShowToast }) {
  const { addToCart } = useCartStore();
  const { recommendedSize } = useAIStore();

  const [selectedSize, setSelectedSize] = useState(41);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState('');

  const productImage = product?.image || product?.defaultThumbnail || product?.variants?.[0]?.thumbnailUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff';
  const productSizes = product?.sizes || product?.variants?.map((v) => v.sizeEu) || ['39', '40', '41', '42', '43', '44'];

  // Danh sách các phiên bản màu sắc mẫu cho sneaker
  const COLOR_OPTIONS = [
    {
      name: product?.color || product?.variants?.[0]?.color || 'Bản Tiêu Chuẩn',
      hex: product?.variants?.[0]?.colorCode || '#DC2626',
      image: productImage,
    },
    {
      name: 'Triple Black Stealth',
      hex: '#171717',
      image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Cloud White / Pure Red',
      hex: '#F8FAFC',
      image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80',
    },
  ];

  useEffect(() => {
    if (product) {
      setSelectedSize(
        recommendedSize && productSizes.includes(String(recommendedSize))
          ? String(recommendedSize)
          : productSizes[0] || '41'
      );
      setSelectedColorIndex(0);
      setQuantity(1);
      setActiveImage(productImage);
    }
  }, [product, recommendedSize]);

  // Đóng modal khi nhấn phím Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : null;

  const normalizeVND = (amount) => {
    if (!amount) return 0;
    return amount < 10000 ? amount * 25000 : amount;
  };

  const formatVND = (amount) => {
    const val = normalizeVND(amount);
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const handleAddToCart = () => {
    const matchedVariant = product.variants?.find(
      (v) => String(v.sizeEu) === String(selectedSize)
    ) || product.variants?.[0];

    const colorObj = COLOR_OPTIONS[selectedColorIndex];
    addToCart(
      {
        id: String(product.id),
        variantId: matchedVariant?.id,
        sku: matchedVariant?.sku,
        name: product.name,
        price: matchedVariant?.price ? Number(matchedVariant.price) : product.price,
        image: activeImage || matchedVariant?.thumbnailUrl || product.image,
        color: colorObj ? colorObj.name : (matchedVariant?.color || product.color || 'Bản Tiêu Chuẩn'),
        brand: product.brand || product.brandName || 'NewMos',
        quantity: quantity,
      },
      selectedSize
    );

    if (onShowToast) {
      onShowToast({
        title: 'Đã thêm vào giỏ hàng!',
        message: `${product.name} (Size EU ${selectedSize}, SL: ${quantity})`,
        image: activeImage || product.image,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      />

      {/* Modal Dialog */}
      <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
        <div className="relative w-full max-w-4xl bg-[#111111] border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl text-white animate-in zoom-in-95 duration-200">
          {/* Nút đóng X */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-neutral-900/80 hover:bg-red-600 text-neutral-400 hover:text-white flex items-center justify-center transition-all"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Cột Trái: Xem Ảnh Lớn & Thư viện ảnh */}
            <div className="p-6 sm:p-8 bg-neutral-950 flex flex-col justify-between border-b md:border-b-0 md:border-r border-neutral-850">
              {/* Ảnh Lớn */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-850 shadow-inner group">
                <img
                  src={activeImage || product.image}
                  alt={product.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />

                {/* Badge góc trên ảnh */}
                <div className="absolute top-3 left-3 flex gap-1.5">
                  {product.isHot && (
                    <span className="px-2.5 py-1 rounded bg-red-600 text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-md">
                      <Flame className="w-3 h-3 fill-white" /> HÀNG MỚI VỀ
                    </span>
                  )}
                  {discountPercent && (
                    <span className="px-2 py-0.5 rounded bg-red-600 text-white font-extrabold text-[10px] uppercase tracking-wider">
                      -{discountPercent}%
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/80 backdrop-blur border border-neutral-800 text-[11px] font-bold text-red-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Trợ Lý AI Đo Size Chân</span>
                </div>
              </div>

              {/* Gallery Thumbnails */}
              <div className="flex gap-3 pt-4 overflow-x-auto">
                {COLOR_OPTIONS.map((c, idx) => (
                  <button
                    key={c.name}
                    onClick={() => {
                      setSelectedColorIndex(idx);
                      setActiveImage(c.image);
                    }}
                    className={cn(
                      'relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-neutral-900',
                      selectedColorIndex === idx
                        ? 'border-red-500 shadow-md shadow-red-500/30'
                        : 'border-neutral-800 opacity-60 hover:opacity-100'
                    )}
                  >
                    <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Cột Phải: Thông tin chi tiết, Chọn màu, Chọn size, Thêm giỏ */}
            <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-red-500">
                    {product.brand}
                  </span>
                  <h2 className="text-2xl font-black text-white mt-1 tracking-tight">
                    {product.name}
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    Mã sản phẩm: <span className="font-mono text-neutral-300">{product.id}</span>
                  </p>
                </div>

                {/* Giá sale và giá gốc */}
                <div className="flex items-baseline gap-3 pt-1 border-t border-neutral-850">
                  <span className="text-2xl font-black text-red-600 font-mono">
                    {formatVND(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-neutral-500 line-through font-mono">
                      {formatVND(product.originalPrice)}
                    </span>
                  )}
                  {discountPercent && (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      Tiết kiệm {discountPercent}%
                    </span>
                  )}
                </div>

                {/* 1. Chọn Màu Sắc */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-neutral-300">
                      Màu Sắc:{' '}
                      <span className="text-white font-semibold">
                        {COLOR_OPTIONS[selectedColorIndex]?.name}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {COLOR_OPTIONS.map((color, idx) => (
                      <button
                        key={color.name}
                        onClick={() => {
                          setSelectedColorIndex(idx);
                          setActiveImage(color.image);
                        }}
                        className={cn(
                          'w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer',
                          selectedColorIndex === idx
                            ? 'border-red-500 ring-2 ring-red-500/40 scale-110'
                            : 'border-neutral-700 hover:border-neutral-500'
                        )}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      >
                        {selectedColorIndex === idx && (
                          <div className={cn('w-2 h-2 rounded-full', color.hex === '#F8FAFC' ? 'bg-black' : 'bg-white')} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Chọn Cỡ Size Giày (EU) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-neutral-300">Chọn Size Giày (EU):</span>
                    {recommendedSize && (
                      <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-red-500" />
                        AI Khuyên Dùng: Size {recommendedSize}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {product.sizes?.map((size) => {
                      const isRecommended = recommendedSize && Number(recommendedSize) === size;
                      return (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={cn(
                            'py-2.5 text-xs font-extrabold rounded-xl border transition-all relative',
                            selectedSize === size
                              ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700',
                            isRecommended && selectedSize !== size && 'border-red-500/60 text-red-400'
                          )}
                        >
                          <span>{size}</span>
                          {isRecommended && (
                            <span className="absolute -top-1.5 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-neutral-900" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Chọn Số Lượng */}
                <div className="flex items-center gap-4 pt-1">
                  <span className="text-xs font-bold text-neutral-300">Số Lượng:</span>
                  <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-1">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-7 h-7 rounded-lg hover:bg-neutral-800 text-neutral-300 flex items-center justify-center text-xs transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center font-bold text-sm text-white font-mono">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-7 h-7 rounded-lg hover:bg-neutral-800 text-neutral-300 flex items-center justify-center text-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. Nút Thêm Vào Giỏ CTA Đỏ & Cam kết */}
              <div className="space-y-4 pt-4 border-t border-neutral-850">
                <button
                  onClick={handleAddToCart}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-sm uppercase tracking-wider shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 transition-all duration-200 active:scale-98 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Thêm Vào Giỏ • {formatVND(product.price * quantity)}</span>
                </button>

                <div className="grid grid-cols-3 gap-2 text-[11px] text-neutral-400 text-center pt-2">
                  <div className="flex flex-col items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Chính hãng 100%</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Truck className="w-4 h-4 text-red-400" />
                    <span>Giao nhanh 2h</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <RotateCcw className="w-4 h-4 text-neutral-300" />
                    <span>Đổi trả 30 ngày</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuickViewModal;
