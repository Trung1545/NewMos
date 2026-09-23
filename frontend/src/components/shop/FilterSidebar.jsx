import { SlidersHorizontal, RotateCcw, Check, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

export function FilterSidebar({
  selectedBrands = [],
  onBrandChange,
  priceRange = 10000000,
  onPriceChange,
  selectedSizes = [],
  onSizeToggle,
  selectedColors = [],
  onColorToggle,
  onReset,
  brandCounts = {},
  availableBrands = ['NewMos Sport', 'Nike', 'Jordan', 'Adidas', 'ASICS', 'Puma', 'New Balance'],
  className = '',
}) {
  const SIZES = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45];

  const COLOR_OPTIONS = [
    { name: 'Đen', hex: '#111111', textColor: 'text-white' },
    { name: 'Trắng', hex: '#F8FAFC', textColor: 'text-black', isLight: true },
    { name: 'Đỏ', hex: '#DC2626', textColor: 'text-white' },
    { name: 'Xanh', hex: '#2563EB', textColor: 'text-white' },
    { name: 'Xám', hex: '#6B7280', textColor: 'text-white' },
    { name: 'Vàng', hex: '#EAB308', textColor: 'text-black' },
  ];

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const hasActiveFilters =
    selectedBrands.length > 0 ||
    priceRange < 10000000 ||
    selectedSizes.length > 0 ||
    selectedColors.length > 0;

  return (
    <aside className={cn('bg-[#111111] border border-neutral-850 rounded-3xl p-6 text-white space-y-7', className)}>
      {/* Header Bộ lọc & Nút Reset */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-500 flex items-center justify-center border border-red-500/30">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <h3 className="text-base font-black uppercase tracking-wider text-white">
            Bộ Lọc Thông Minh
          </h3>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-xs font-bold text-red-500 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
            title="Xóa toàn bộ bộ lọc"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* 1. Lọc theo Thương hiệu (Checkbox) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-neutral-300">
            Thương Hiệu
          </span>
          {selectedBrands.length > 0 && (
            <span className="text-[10px] font-bold text-red-500 bg-red-950/60 px-2 py-0.5 rounded-full border border-red-500/30">
              {selectedBrands.length} đã chọn
            </span>
          )}
        </div>

        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {availableBrands.map((brand) => {
            const isChecked = selectedBrands.includes(brand);
            const count = brandCounts[brand] ?? 0;
            return (
              <label
                key={brand}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-900 transition-colors cursor-pointer group select-none"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all',
                      isChecked
                        ? 'bg-red-600 border-red-500 text-white shadow-sm shadow-red-600/40'
                        : 'border-neutral-700 bg-neutral-900 group-hover:border-neutral-500'
                    )}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span
                    className={cn(
                      'text-xs font-bold tracking-wide transition-colors',
                      isChecked ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-200'
                    )}
                  >
                    {brand}
                  </span>
                </div>
                {count > 0 && (
                  <span className="text-[11px] font-mono text-neutral-500 font-semibold">
                    ({count})
                  </span>
                )}
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onBrandChange(brand)}
                  className="sr-only"
                />
              </label>
            );
          })}
        </div>
      </div>

      {/* 2. Lọc theo Khoảng giá (Price Range Slider) */}
      <div className="space-y-3 pt-3 border-t border-neutral-850">
        <div className="flex justify-between items-center text-xs">
          <span className="font-black uppercase tracking-wider text-neutral-300">
            Khoảng Giá (VND)
          </span>
          <span className="font-mono font-black text-red-500 text-xs">
            {formatVND(priceRange)}
          </span>
        </div>

        <div className="space-y-2">
          <input
            type="range"
            min={1000000}
            max={10000000}
            step={200000}
            value={priceRange}
            onChange={(e) => onPriceChange(Number(e.target.value))}
            className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-600 focus:outline-hidden"
          />

          <div className="flex justify-between text-[10px] font-mono text-neutral-500 font-bold">
            <span>1.000.000₫</span>
            <span>10.000.000₫</span>
          </div>
        </div>
      </div>

      {/* 3. Lọc theo Size (Lưới nút bấm chọn size từ 38 đến 45, đổi màu ĐỎ khi active) */}
      <div className="space-y-3 pt-3 border-t border-neutral-850">
        <div className="flex items-center justify-between text-xs">
          <span className="font-black uppercase tracking-wider text-neutral-300">
            Kích Cỡ Giày (EU)
          </span>
          {selectedSizes.length > 0 && (
            <span className="text-[10px] font-bold text-red-500">
              {selectedSizes.length} size
            </span>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {SIZES.map((size) => {
            const isActive = selectedSizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => onSizeToggle(size)}
                className={cn(
                  'py-2 text-xs font-black rounded-xl border transition-all duration-200 cursor-pointer text-center',
                  isActive
                    ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/40 scale-105'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-600'
                )}
                title={`Lọc size EU ${size}`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Lọc theo Màu sắc (Color Dots: Đen, Trắng, Đỏ, Xanh...) */}
      <div className="space-y-3 pt-3 border-t border-neutral-850">
        <div className="flex items-center justify-between text-xs">
          <span className="font-black uppercase tracking-wider text-neutral-300">
            Màu Sắc
          </span>
          {selectedColors.length > 0 && (
            <span className="text-[10px] font-bold text-red-500">
              {selectedColors.join(', ')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {COLOR_OPTIONS.map((color) => {
            const isActive = selectedColors.includes(color.name);
            return (
              <button
                key={color.name}
                type="button"
                onClick={() => onColorToggle(color.name)}
                className={cn(
                  'w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer relative',
                  isActive
                    ? 'border-red-500 ring-2 ring-red-500/50 scale-110 shadow-md shadow-red-600/30'
                    : 'border-neutral-700 hover:border-neutral-500 opacity-80 hover:opacity-100'
                )}
                style={{ backgroundColor: color.hex }}
                title={`Lọc màu: ${color.name}`}
              >
                {isActive && (
                  <Check
                    className={cn(
                      'w-3.5 h-3.5 stroke-[3]',
                      color.isLight ? 'text-black' : 'text-white'
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Gợi ý AI Foot sizing */}
      <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
          <Sparkles className="w-4 h-4 text-red-500" />
          <span>Chưa biết size của bạn?</span>
        </div>
        <p className="text-[11px] text-neutral-400 leading-relaxed">
          Sử dụng tính năng AI Fit Guide để quét dáng chân và tìm cỡ giày vừa vặn tuyệt đối.
        </p>
      </div>
    </aside>
  );
}

export default FilterSidebar;
