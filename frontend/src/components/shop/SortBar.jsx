import { ArrowUpDown, SlidersHorizontal, Grid3X3, LayoutGrid } from 'lucide-react';
import { cn } from '../../lib/utils';

export function SortBar({
  totalResults = 0,
  sortBy = 'featured',
  onSortChange,
  onOpenMobileFilters,
  activeFilterCount = 0,
  viewColumns = 3,
  onViewColumnsChange,
}) {
  const SORT_OPTIONS = [
    { value: 'featured', label: 'Nổi bật nhất' },
    { value: 'newest', label: 'Mới nhất' },
    { value: 'bestseller', label: 'Bán chạy' },
    { value: 'price-asc', label: 'Giá: Thấp đến Cao' },
    { value: 'price-desc', label: 'Giá: Cao đến Thấp' },
  ];

  return (
    <div className="bg-[#111111] border border-neutral-850 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* 1. Thông báo số lượng kết quả tìm được & Nút mở filter trên Mobile */}
      <div className="flex items-center justify-between w-full sm:w-auto gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">Kết quả:</span>
          <span className="text-sm font-black text-white font-mono">
            {totalResults}
          </span>
          <span className="text-xs text-neutral-400">sản phẩm sneaker</span>
        </div>

        {/* Nút bật Filter trên Mobile */}
        <button
          onClick={onOpenMobileFilters}
          className="lg:hidden flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs font-bold text-white hover:border-red-500 transition-colors cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-red-500" />
          <span>Bộ lọc</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-extrabold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* 2. Sắp xếp & Layout Toggle */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        {/* Sắp xếp dropdown */}
        <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
          <span className="text-neutral-400 hidden md:inline flex items-center gap-1 font-semibold">
            <ArrowUpDown className="w-3.5 h-3.5" /> Sắp xếp:
          </span>
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full sm:w-48 bg-neutral-900 border border-neutral-800 text-white text-xs font-bold rounded-xl px-3.5 py-2 pr-8 focus:outline-hidden focus:border-red-500 cursor-pointer appearance-none"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-neutral-900 text-white py-1">
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
              <ArrowUpDown className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* View Columns Toggle (Desktop only) */}
        {onViewColumnsChange && (
          <div className="hidden md:flex items-center gap-1 bg-neutral-900 border border-neutral-800 p-1 rounded-xl">
            <button
              onClick={() => onViewColumnsChange(3)}
              className={cn(
                'p-1.5 rounded-lg transition-colors cursor-pointer',
                viewColumns === 3
                  ? 'bg-neutral-800 text-red-500'
                  : 'text-neutral-400 hover:text-white'
              )}
              title="Lưới 3 cột"
              aria-label="Lưới 3 cột"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewColumnsChange(4)}
              className={cn(
                'p-1.5 rounded-lg transition-colors cursor-pointer',
                viewColumns === 4
                  ? 'bg-neutral-800 text-red-500'
                  : 'text-neutral-400 hover:text-white'
              )}
              title="Lưới 4 cột"
              aria-label="Lưới 4 cột"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SortBar;
