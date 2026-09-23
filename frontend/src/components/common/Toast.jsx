import { CheckCircle2, X, ShoppingBag, AlertCircle } from 'lucide-react';
import { useCartStore } from '../../stores/useCartStore';

export function Toast({ toast, onDismiss }) {
  const { toggleCart } = useCartStore();

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-[#121212] border border-neutral-700 text-white rounded-2xl p-4 shadow-2xl shadow-red-950/40 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
      {/* Thumbnail */}
      {toast.image ? (
        <img
          src={toast.image}
          alt={toast.title}
          className="w-12 h-12 rounded-xl object-cover bg-neutral-900 border border-neutral-800 shrink-0"
        />
      ) : toast.isError ? (
        <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center shrink-0 border border-red-500/30">
          <AlertCircle className="w-5 h-5" />
        </div>
      ) : (
        <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/30">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-white flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full inline-block ${toast.isError ? 'bg-red-500' : 'bg-emerald-500'}`} />
          {toast.title || 'Thông Báo'}
        </h4>
        <p className="text-xs text-neutral-300 font-medium truncate mt-0.5">
          {toast.message}
        </p>
        {!toast.isError && (
          <button
            onClick={() => {
              toggleCart();
              onDismiss();
            }}
            className="text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 mt-1 underline underline-offset-2"
          >
            <ShoppingBag className="w-3 h-3" /> Xem giỏ hàng
          </button>
        )}
      </div>

      {/* Nút đóng */}
      <button
        onClick={onDismiss}
        className="p-1 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default Toast;
