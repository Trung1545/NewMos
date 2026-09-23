import { Zap } from 'lucide-react';

export function PageLoadingSpinner() {
  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center p-6 select-none animate-fadeIn">
      {/* Container Spinner thể thao */}
      <div className="relative flex items-center justify-center">
        {/* Glow Ring ngoài */}
        <div className="w-20 h-20 rounded-full border-4 border-slate-100 border-t-red-600 animate-spin" />
        
        {/* Vòng quay nghịch đảo */}
        <div className="absolute w-14 h-14 rounded-full border-2 border-dashed border-neutral-300 border-b-black animate-spin [animation-duration:1.5s] [animation-direction:reverse]" />

        {/* Icon thể thao ở giữa */}
        <div className="absolute flex items-center justify-center w-8 h-8 rounded-full bg-red-600 text-white shadow-md shadow-red-500/30 animate-pulse">
          <Zap className="w-4 h-4 fill-current" />
        </div>
      </div>

      {/* Brand & Loading text */}
      <div className="mt-6 text-center space-y-1.5">
        <div className="flex items-center justify-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-ping" />
          <p className="text-xs font-mono font-black uppercase tracking-[0.25em] text-[#0A0A0A]">
            NEWMOS SPEED TECH
          </p>
        </div>
        <p className="text-xs text-neutral-500 font-medium">
          Đang nạp phân hệ và khởi tạo dữ liệu...
        </p>
      </div>
    </div>
  );
}

export default PageLoadingSpinner;
