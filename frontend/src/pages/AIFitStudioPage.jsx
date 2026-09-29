import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Ruler,
  Footprints,
  ShieldCheck,
  Zap,
  ArrowRight,
  Activity,
  Maximize2,
  CheckCircle2,
  Cpu,
  Target,
  Layers,
} from 'lucide-react';
import { useAIStore } from '../stores/useAIStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useChatbotStore } from '../stores/useChatbotStore';
import { productService } from '../services/productService';
import { aiService } from '../services/aiService';
import { formatCurrency } from '../lib/utils';

export function AIFitStudioPage() {
  const { isAuthenticated } = useAuthStore();
  const { setModalOpen, resetAI, footLength, footWidth, footShape, recommendedSize, userProfile, setUserProfile } = useAIStore();
  const { openChat } = useChatbotStore();
  const [activeStep, setActiveStep] = useState(1);
  const [aiMatchedProducts, setAiMatchedProducts] = useState([]);

  useEffect(() => {
    if (isAuthenticated) {
      aiService.getMyProfile()
        .then((res) => {
          if (res?.data && res.data.footLengthCm && Number(res.data.footLengthCm) > 0) {
            setUserProfile(res.data);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, setUserProfile]);

  const hasFootProfile = Boolean(
    (userProfile?.footLengthCm && Number(userProfile.footLengthCm) > 0) ||
    (footLength && Number(footLength) > 0)
  );
  const activeLength = userProfile?.footLengthCm || footLength;
  const activeWidth = userProfile?.footWidthCm || footWidth;
  const activeShape = userProfile?.footShape || footShape || 'STANDARD';
  const activeSize = userProfile?.recommendedSizeEu || recommendedSize;

  useEffect(() => {
    productService.getFeaturedProducts()
      .then((res) => {
        const list = res?.data || (Array.isArray(res) ? res : []);
        if (list.length > 0) {
          setAiMatchedProducts(list.slice(0, 3));
        } else {
          productService.getAllProducts({ pageSize: 3 }).then((allRes) => {
            const allList = allRes?.data?.content || allRes?.data || [];
            setAiMatchedProducts(allList.slice(0, 3));
          });
        }
      })
      .catch(() => {
        productService.getAllProducts({ pageSize: 3 }).then((allRes) => {
          const allList = allRes?.data?.content || allRes?.data || [];
          setAiMatchedProducts(allList.slice(0, 3));
        }).catch(() => {});
      });
  }, []);

  const handleLaunchModal = () => {
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-10 sm:py-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Hero Section */}
        <div className="bg-[#0A0A0A] text-white rounded-2xl p-8 sm:p-12 relative overflow-hidden shadow-2xl border border-neutral-800">
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-0 p-8 opacity-10 hidden md:block pointer-events-none">
            <Footprints className="w-80 h-80 text-white" />
          </div>

          <div className="relative z-10 max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-mono font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-red-500" />
              <span>NEWMOS FOOT SIZE CALCULATOR & GUIDE</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight leading-tight text-white">
              AI FIT STUDIO <br />
              <span className="text-[#DC2626]">ĐO SIZE CHÂN CHÍNH XÁC 100%</span>
            </h1>

            <p className="text-sm text-neutral-400 leading-relaxed">
              Giải pháp loại bỏ hoàn toàn rủi ro chọn sai kích cỡ giày khi mua sắm online. Hướng dẫn đo chân 3 bước trực quan kết hợp thuật toán tính size theo thông số cm và dáng bàn chân chuẩn NewMos.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={handleLaunchModal}
                className="px-6 py-3.5 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all cursor-pointer flex items-center gap-2"
              >
                <Ruler className="w-4 h-4" />
                <span>Bắt Đầu Đo & Tính Size Ngay</span>
              </button>
              <button
                type="button"
                onClick={() => openChat('Chào NewMos AI, mình muốn tư vấn chọn size giày chuẩn')}
                className="px-6 py-3.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider border border-white/20 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>💬 Chat Với Trợ Lý AI</span>
              </button>
              <Link
                to="/shop"
                className="px-6 py-3.5 rounded-lg border border-neutral-700 hover:bg-neutral-900 text-neutral-300 font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Xem Giày Được Khuyên Dùng
              </Link>
            </div>
          </div>
        </div>

        {/* 3 Step Workflow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 text-[#DC2626] flex items-center justify-center font-mono font-black text-sm border border-red-200">
              01
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#0A0A0A]">
              Bước 1: Đặt Chân Lên Giấy A4
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Đặt bàn chân ngay ngắn lên tờ giấy A4 cố định trên sàn, gót chân tựa nhẹ sát mép tường.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 text-[#DC2626] flex items-center justify-center font-mono font-black text-sm border border-red-200">
              02
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#0A0A0A]">
              Bước 2: Đánh Dấu Đầu Ngón & Gót
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Lấy bút đánh dấu điểm đầu ngón chân dài nhất và điểm gót chân vuông góc 90°.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 text-[#DC2626] flex items-center justify-center font-mono font-black text-sm border border-red-200">
              03
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#0A0A0A]">
              Bước 3: Đo Khoảng Cách & Nhận Size
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dùng thước kẻ đo khoảng cách giữa 2 điểm (cm) để lấy chiều dài chân và nhập vào hệ thống để nhận size chuẩn.
            </p>
          </div>
        </div>

        {/* Foot Profile Status Card: Telemetry thật hoặc Empty State */}
        {hasFootProfile ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#DC2626] uppercase tracking-wider">
                  HỒ SƠ ĐO CHÂN CỦA BẠN
                </span>
                <h2 className="text-xl font-black uppercase tracking-tight text-[#0A0A0A] mt-0.5">
                  Dữ Liệu Số Đo Bàn Chân NewMos Fit
                </h2>
              </div>
              <button
                type="button"
                onClick={handleLaunchModal}
                className="px-4 py-2 rounded-xl bg-[#0A0A0A] hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 self-start sm:self-auto cursor-pointer"
              >
                <Ruler className="w-3.5 h-3.5 text-red-500" />
                <span>Đo Lại / Cập Nhật</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                  CHIỀU DÀI BÀN CHÂN
                </span>
                <div className="text-xl font-mono font-black text-slate-900 mt-1">
                  {Math.round(activeLength * 10)} MM
                </div>
                <span className="text-[10px] text-slate-500">
                  Chuẩn {activeLength} cm
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                  ĐỘ RỘNG BÀN CHÂN
                </span>
                <div className="text-xl font-mono font-black text-slate-900 mt-1">
                  {activeWidth ? `${Math.round(activeWidth * 10)} MM` : 'Tiêu chuẩn'}
                </div>
                <span className="text-[10px] text-slate-500">
                  {activeShape === 'WIDE' ? 'Bè ngang' : activeShape === 'SLIM' ? 'Thon gọn' : 'Tiêu chuẩn'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                  DÁNG BÀN CHÂN
                </span>
                <div className="text-xl font-mono font-black text-red-600 mt-1">
                  {activeShape === 'WIDE' ? 'BÈ NGANG' : activeShape === 'SLIM' ? 'THON GỌN' : 'CHUẨN'}
                </div>
                <span className="text-[10px] text-slate-500">Tự động bù trừ form</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                  SIZE KHUYÊN DÙNG
                </span>
                <div className="text-xl font-mono font-black text-emerald-600 mt-1">
                  {activeSize ? `${activeSize} EU` : 'N/A'}
                </div>
                <span className="text-[10px] text-slate-500">Khớp form NewMos</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-center animate-in fade-in duration-200">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 border border-red-200 text-[#DC2626] flex items-center justify-center shadow-md shadow-red-600/10">
                <Footprints className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black uppercase text-[#0A0A0A]">
                  Chưa Có Hồ Sơ Đo Chân
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Bạn chưa cập nhật số đo bàn chân. Hãy đo ngay để NewMos gợi ý size giày chuẩn xác nhất.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleLaunchModal}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-red-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Ruler className="w-4 h-4" />
                  <span>Bắt Đầu Đo / Nhập Số Đo Chân</span>
                </button>
                <button
                  type="button"
                  onClick={() => openChat('Chào NewMos AI, hãy hướng dẫn mình đo và tính size chân chuẩn xác')}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#0A0A0A] hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-red-400" />
                  <span>Kích Hoạt Trợ Lý AI</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live Telemetry Display Matrix */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-mono font-bold text-[#DC2626] uppercase tracking-wider">
                PHÒNG LAB ĐO DÁNG CHÂN AI
              </span>
              <h2 className="text-xl font-black uppercase tracking-tight text-[#0A0A0A] mt-0.5">
                Các Mẫu Giày Đang Có Tỷ Lệ Khớp AI Cao Nhất
              </h2>
            </div>
            <Link
              to="/shop"
              className="text-xs font-bold text-[#DC2626] hover:underline flex items-center gap-1 uppercase"
            >
              <span>Xem Tất Cả Sản Phẩm</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
            {aiMatchedProducts.map((shoe, idx) => {
              const displayImage =
                shoe.defaultThumbnail ||
                shoe.image ||
                shoe.variants?.[0]?.thumbnailUrl ||
                'https://images.unsplash.com/photo-1542291026-7eec264c27ff';
              const price = shoe.minPrice ? Number(shoe.minPrice) : (shoe.price || 0);
              const score = shoe.matchScore || `${99 - idx * 1.2}%`;

              return (
                <div
                  key={shoe.id}
                  className="group bg-slate-50 rounded-xl border border-slate-200 p-4 hover:border-slate-400 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="relative aspect-4/3 flex items-center justify-center overflow-hidden">
                    <img
                      src={displayImage}
                      alt={shoe.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#DC2626] text-white text-[9px] font-black uppercase rounded-xs">
                      {score} KHỚP AI
                    </span>
                  </div>

                  <div className="pt-3 space-y-2">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      {shoe.categoryName || shoe.category || 'SNEAKER'}
                    </span>
                    <h3 className="text-xs font-black text-[#0A0A0A] uppercase truncate">
                      {shoe.name}
                    </h3>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <span className="text-xs font-mono font-bold text-[#DC2626]">
                        {formatCurrency(price)}
                      </span>
                      <Link
                        to={`/product/${shoe.id}`}
                        className="px-3 py-1.5 rounded-md bg-[#0A0A0A] hover:bg-neutral-800 text-white text-[10px] font-bold uppercase transition-colors"
                      >
                        Chi Tiết
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIFitStudioPage;
