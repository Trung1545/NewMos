import { useState } from 'react';
import { ShoppingCart, Heart, Sparkles, Zap, Check } from 'lucide-react';
import { useCartStore } from '../../stores/useCartStore';
import { useAIStore } from '../../stores/useAIStore';
import { cn, formatCurrency } from '../../lib/utils';

export function ProductCard({ product, onQuickView, onShowToast }) {
  const { addToCart } = useCartStore();
  const { setModalOpen, resetAI } = useAIStore();

  const SIZES = product.sizes || product.variants?.map((v) => v.sizeEu) || ['39', '40', '41', '42', '43', '44'];

  const [selectedSize, setSelectedSize] = useState(SIZES[0] || '40');
  const [isLiked, setIsLiked] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const rawPrice = product.price ?? product.minPrice ?? 0;
  const rawOriginalPrice = product.originalPrice ?? product.variants?.[0]?.originalPrice ?? null;

  // Chuẩn hóa đơn vị tiền tệ VND
  const normalizedPrice = rawPrice < 10000 && rawPrice > 0 ? rawPrice * 25000 : rawPrice;
  const normalizedOriginalPrice = rawOriginalPrice
    ? (rawOriginalPrice < 10000 && rawOriginalPrice > 0 ? rawOriginalPrice * 25000 : rawOriginalPrice)
    : null;

  const displayImage =
    product.imageUrl ||
    product.defaultThumbnail ||
    product.image ||
    product.variants?.[0]?.thumbnailUrl ||
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=80';

  const handleQuickBuy = (e) => {
    e.stopPropagation();
    setIsAdding(true);

    const matchedVariant = product.variants?.find(
      (v) => String(v.sizeEu) === String(selectedSize)
    ) || product.variants?.[0];

    addToCart(
      {
        id: String(product.id),
        variantId: matchedVariant?.id,
        sku: matchedVariant?.sku,
        name: product.name,
        price: matchedVariant?.price ? Number(matchedVariant.price) : normalizedPrice,
        image: matchedVariant?.thumbnailUrl || displayImage,
        color: matchedVariant?.color || product.color || 'Bản Tiêu Chuẩn',
        brand: product.brand || product.brandName || 'NewMos',
        quantity: 1,
      },
      selectedSize
    );

    if (onShowToast) {
      onShowToast({
        title: 'ĐÃ THÊM VÀO GIỎ HÀNG',
        message: `${product.name} (Size ${selectedSize} EU)`,
        image: displayImage,
      });
    }

    setTimeout(() => {
      setIsAdding(false);
    }, 600);
  };

  const handleOpenAICalculate = (e) => {
    e.stopPropagation();
    resetAI();
    setModalOpen(true);
  };

  // Badge style resolver
  const getBadgeStyle = (tagType) => {
    switch (tagType) {
      case 'hot':
      case 'bestseller':
      case 'red':
        return 'bg-red-600 text-white';
      case 'discount':
      case 'limited':
      case 'dark':
        return 'bg-[#0B0F19] text-white';
      case 'new-tech':
        return 'bg-slate-100 text-slate-800 border border-slate-300';
      default:
        return 'bg-red-600 text-white';
    }
  };

  return (
    <div
      onClick={() => onQuickView && onQuickView(product)}
      className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-slate-400 transition-all duration-300 flex flex-col h-full cursor-pointer"
    >
      {/* 1. Header Box: Badges & Wishlist */}
      <div className="relative aspect-4/3 overflow-hidden bg-slate-50 flex items-center justify-center p-6">
        {/* Top Tag Badge */}
        <div className="absolute top-3.5 left-3.5 z-10">
          <span
            className={cn(
              'inline-block px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-sm shadow-xs font-mono',
              getBadgeStyle(product.tagType || (product.isHot ? 'hot' : 'new-tech'))
            )}
          >
            {product.tag || 'HÀNG MỚI VỀ'}
          </span>
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-600 hover:text-red-600 transition-all z-10 cursor-pointer"
          aria-label="Yêu thích"
        >
          <Heart className={cn('w-4 h-4', isLiked && 'fill-red-600 text-red-600')} />
        </button>

        {/* Sneaker Image */}
        <img
          src={displayImage}
          alt={product.name}
          className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-500 ease-out drop-shadow-md"
          loading="lazy"
        />

        {/* Telemetry Pill Badge below image */}
        <div className="absolute bottom-3 inset-x-3 flex justify-center z-10 pointer-events-none">
          <div className="px-3 py-1 rounded-sm bg-[#0B0F19]/90 text-white text-[10px] font-mono font-bold tracking-wider flex items-center gap-1.5 shadow-md border border-neutral-700">
            <Sparkles className="w-3 h-3 text-red-500" />
            <span>{product.telemetryTag || 'PERFECT FIT: VỪA VẶN HOÀN HẢO'}</span>
          </div>
        </div>
      </div>

      {/* 2. Product Meta Info */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4 bg-white">
        <div>
          {/* Category Series + Original Price */}
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400">
            <span>{product.series || product.category || product.categoryName || 'SNEAKER CHÍNH HÃNG'}</span>
            {normalizedOriginalPrice && normalizedOriginalPrice > normalizedPrice && (
              <span className="line-through text-slate-400 font-mono">
                {formatCurrency(normalizedOriginalPrice)}
              </span>
            )}
          </div>

          {/* Title + Price */}
          <div className="flex items-baseline justify-between gap-2 mt-1">
            <h3 className="text-base font-black text-slate-900 font-tech-heading tracking-tight uppercase group-hover:text-red-600 transition-colors line-clamp-1">
              {product.name}
            </h3>
            <span className="text-base sm:text-lg font-black text-red-600 font-mono tracking-tight shrink-0">
              {formatCurrency(normalizedPrice)}
            </span>
          </div>
        </div>

        {/* Size Selection Section */}
        <div className="space-y-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between text-[10px] font-mono uppercase">
            <span className="font-bold text-slate-500 tracking-wider">
              CHỌN SIZE (EU)
            </span>
            <button
              onClick={handleOpenAICalculate}
              className="text-red-600 hover:text-red-700 font-bold flex items-center gap-0.5 tracking-wider transition-colors cursor-pointer"
            >
              <Zap className="w-2.5 h-2.5 fill-red-600" />
              <span>AI ĐO SIZE</span>
            </button>
          </div>

          {/* Size Pills */}
          <div className="grid grid-cols-6 gap-1.5">
            {SIZES.map((size) => {
              const isSelected = selectedSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={cn(
                    'py-1 text-center font-mono text-[11px] font-bold rounded-sm border transition-all cursor-pointer',
                    isSelected
                      ? 'bg-[#0B0F19] text-white border-[#0B0F19] shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Red Full-width Quick Buy Button */}
        <button
          onClick={handleQuickBuy}
          disabled={isAdding}
          className={cn(
            'w-full py-2.5 px-4 rounded-sm font-mono font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-200 active:scale-98 cursor-pointer shadow-sm',
            isAdding
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20 shadow-md'
          )}
        >
          {isAdding ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>ĐÃ THÊM VÀO GIỎ!</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>MUA NGAY // {formatCurrency(normalizedPrice)}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
