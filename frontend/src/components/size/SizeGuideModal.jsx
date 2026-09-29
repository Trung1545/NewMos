import { useState, useEffect } from 'react';
import {
  X,
  Ruler,
  Footprints,
  Pencil,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Flame,
  Info,
  ShieldAlert,
  Save,
} from 'lucide-react';
import { sizeService } from '../../services/sizeService';
import { aiService } from '../../services/aiService';
import { useAuthStore } from '../../stores/useAuthStore';
import { useAIStore } from '../../stores/useAIStore';

/**
 * Thuật toán tính size NewMos tiêu chuẩn (Chỉ chạy khi length > 0)
 */
function calculateNewMosSizeFallback(lengthCm, footShape, shoeModel = 'RUNNER_PRO') {
  const numLength = parseFloat(lengthCm);
  if (isNaN(numLength) || numLength <= 0) {
    return null;
  }

  let baseSize;
  if (numLength <= 22.5) {
    baseSize = 36;
  } else if (numLength <= 23.0) {
    baseSize = 37;
  } else if (numLength <= 23.5) {
    baseSize = 38;
  } else if (numLength <= 24.0) {
    baseSize = 39;
  } else {
    baseSize = 40;
  }

  const modelName = shoeModel
    ? shoeModel.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Runner Pro';

  let recommendedSize = baseSize;
  let fitStatus = 'Chuẩn size NewMos (True to size)';
  let advice = `Mẫu ${modelName} chuẩn kích thước NewMos. Bàn chân bạn vừa vặn hoàn hảo với size ${recommendedSize}.`;

  if (footShape === 'WIDE') {
    if (baseSize >= 40) {
      recommendedSize = 40;
      fitStatus = 'Chân bè mu dày - Đề xuất size 40 (Size tối đa của NewMos)';
      advice = `Mẫu ${modelName} form ôm thể thao. Do chân bạn bè/mu dày và mẫu đã đạt size 40 tối đa, bạn nên nới nhẹ dây giày để ngón chân thoải mái nhất.`;
    } else {
      recommendedSize = baseSize + 1;
      fitStatus = 'Nên tăng 1 size do chân bè';
      advice = `Mẫu ${modelName} form ôm thể thao, tăng 1 size giúp ngón chân thoải mái khi vận động.`;
    }
  } else if (footShape === 'SLIM') {
    recommendedSize = baseSize;
    fitStatus = 'Vừa vặn ôm chân (Chân thon)';
    advice = `Mẫu ${modelName} thiết kế chuẩn form thể thao. Bàn chân thon gọn của bạn sẽ được ôm sát và khóa gót chắc chắn ở size ${recommendedSize}.`;
  }

  return { recommendedSize, fitStatus, advice };
}

export function SizeGuideModal({
  isOpen = false,
  onClose = () => {},
  onApplySize = () => {},
  onProfileSaved = null,
  initialProfile = null,
  shoeModel = 'RUNNER_PRO',
  shoeName = 'NewMos Runner Pro',
  currentSize = null,
}) {
  const { isAuthenticated } = useAuthStore();
  const { userProfile, setMeasurements, setUserProfile } = useAIStore();

  // Khởi tạo state rỗng / null ban đầu - Không sử dụng mock data
  const [footLengthCm, setFootLengthCm] = useState('');
  const [footWidthCm, setFootWidthCm] = useState('');
  const [footShape, setFootShape] = useState('STANDARD'); // 'SLIM' | 'STANDARD' | 'WIDE'
  const [archType, setArchType] = useState('NORMAL'); // 'NORMAL' | 'HIGH' | 'LOW_FLAT'
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [calculationResult, setCalculationResult] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Đồng bộ với hồ sơ đã lưu nếu có khi mở modal
  useEffect(() => {
    if (isOpen) {
      setValidationError('');
      setSaveSuccessMsg('');
      const existing = initialProfile || userProfile;
      if (existing && existing.footLengthCm && Number(existing.footLengthCm) > 0) {
        setFootLengthCm(String(existing.footLengthCm));
        setFootWidthCm(existing.footWidthCm ? String(existing.footWidthCm) : '');
        setFootShape(existing.footShape || 'STANDARD');
        setArchType(existing.archType || 'NORMAL');
        const instantResult = calculateNewMosSizeFallback(
          existing.footLengthCm,
          existing.footShape || 'STANDARD',
          shoeModel
        );
        setCalculationResult(instantResult);
      } else {
        // Trạng thái ban đầu rỗng / null
        setFootLengthCm('');
        setFootWidthCm('');
        setFootShape('STANDARD');
        setArchType('NORMAL');
        setCalculationResult(null);
      }
    }
  }, [isOpen, initialProfile, userProfile, shoeModel]);

  // Đóng modal khi nhấn phím Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Xử lý thay đổi số đo cm
  const handleLengthChange = (val) => {
    setValidationError('');
    setSaveSuccessMsg('');
    if (val === '') {
      setFootLengthCm('');
      setCalculationResult(null);
      return;
    }
    setFootLengthCm(val);
  };

  const handleSliderChange = (val) => {
    setValidationError('');
    setSaveSuccessMsg('');
    const num = Math.min(26.0, Math.max(21.0, parseFloat(val) || 21.0));
    setFootLengthCm(String(Math.round(num * 10) / 10));
  };

  // Tính toán size giày - Chỉ chạy khi chiều dài > 0
  const handleCalculate = async () => {
    setValidationError('');
    setSaveSuccessMsg('');

    const len = parseFloat(footLengthCm);
    if (isNaN(len) || len <= 0) {
      setValidationError('Vui lòng nhập chiều dài bàn chân hợp lệ (> 0 cm).');
      return;
    }

    if (footWidthCm && (isNaN(parseFloat(footWidthCm)) || parseFloat(footWidthCm) <= 0)) {
      setValidationError('Độ rộng bàn chân nếu nhập phải lớn hơn 0 cm.');
      return;
    }

    setIsCalculating(true);

    const wid = footWidthCm ? parseFloat(footWidthCm) : Math.round(len * 0.38 * 10) / 10;

    // 1. Tính toán ngay lập tức bằng thuật toán chuẩn NewMos
    const instantResult = calculateNewMosSizeFallback(len, footShape, shoeModel);
    setCalculationResult(instantResult);

    // Cập nhật store tạm thời
    setMeasurements(len, wid, shoeModel, footShape);

    // 2. Đồng bộ với Backend API nếu có sẵn
    try {
      const response = await sizeService.calculateSize({
        footLengthCm: len,
        footShape,
        shoeModel: shoeModel || 'RUNNER_PRO',
      });

      const data = response?.data || response;
      if (data && data.recommendedSize) {
        setCalculationResult({
          recommendedSize: data.recommendedSize,
          fitStatus: data.fitStatus || instantResult.fitStatus,
          advice: data.advice || instantResult.advice,
        });
      }
    } catch (err) {
      console.warn('[SizeCalculator] Backend API chưa phản hồi, sử dụng thuật toán chuẩn NewMos:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  // Áp dụng size vào trang chi tiết và lưu hồ sơ
  const handleApply = async () => {
    if (!calculationResult?.recommendedSize) return;

    const len = parseFloat(footLengthCm);
    if (isNaN(len) || len <= 0) return;

    const wid = footWidthCm ? parseFloat(footWidthCm) : Math.round(len * 0.38 * 10) / 10;

    // Cập nhật useAIStore
    setMeasurements(len, wid, shoeModel, footShape);

    // Đồng bộ với Backend nếu người dùng đã đăng nhập
    if (isAuthenticated) {
      setIsSaving(true);
      try {
        const res = await aiService.saveProfile({
          footLengthCm: len,
          footWidthCm: wid,
          footShape,
          archType,
          preferredFit: 'PERFECT',
          brand: 'NewMos',
          profileName: 'Hồ sơ đo chân NewMos',
        });
        const savedData = res?.data || res;
        if (savedData) {
          setUserProfile(savedData);
          if (onProfileSaved) {
            onProfileSaved(savedData);
          }
        }
      } catch (err) {
        console.warn('Không thể lưu hồ sơ đo chân vào tài khoản:', err);
      } finally {
        setIsSaving(false);
      }
    }

    onApplySize(String(calculationResult.recommendedSize));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
      {/* Backdrop mờ nền đen thể thao */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-6">
        <div className="relative w-full max-w-4xl bg-[#0A0A0A] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl shadow-red-950/30 text-white space-y-0 animate-in zoom-in-95 duration-200">
          {/* ================= HEADER BAR ================= */}
          <div className="bg-[#141414] px-5 sm:px-7 py-4 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] animate-pulse shrink-0" />
              <div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="font-extrabold text-white uppercase tracking-wider">
                    NEWMOS ATHLETIC LAB
                  </span>
                  <span className="text-neutral-600">|</span>
                  <span className="text-[#DC2626] font-black uppercase tracking-wider">
                    MANUAL FOOT SIZE CALCULATOR
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-tight mt-0.5">
                  Hướng Dẫn Đo Chân & Tính Size Chuẩn Xác
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ================= KHU VỰC 1: HƯỚNG DẪN ĐO CHÂN 3 BƯỚC TRỰC QUAN ================= */}
          <div className="p-5 sm:p-7 border-b border-neutral-800 bg-[#0E0E0E]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-[#DC2626]" />
                <span className="text-xs font-mono font-black uppercase tracking-wider text-neutral-300">
                  KHU VỰC 1 // QUY TRÌNH TỰ ĐO CHÂN 3 BƯỚC CHUẨN XÁC
                </span>
              </div>
              <span className="hidden sm:inline-block text-[11px] font-mono text-neutral-500">
                Độ sai lệch &lt; 0.2 cm
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Bước 1 */}
              <div className="bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 p-4 rounded-xl space-y-2.5 transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-red-950/60 border border-red-500/30 text-[#DC2626] flex items-center justify-center font-mono font-black text-xs">
                    01
                  </div>
                  <Footprints className="w-4 h-4 text-neutral-500" />
                </div>
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wide">
                  Bước 1: Chuẩn bị tờ giấy A4
                </h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Đặt bàn chân ngay ngắn lên tờ giấy A4, gót chân tựa nhẹ sát mép tường phẳng.
                </p>
              </div>

              {/* Bước 2 */}
              <div className="bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 p-4 rounded-xl space-y-2.5 transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-red-950/60 border border-red-500/30 text-[#DC2626] flex items-center justify-center font-mono font-black text-xs">
                    02
                  </div>
                  <Pencil className="w-4 h-4 text-neutral-500" />
                </div>
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wide">
                  Bước 2: Đánh dấu 2 điểm cực
                </h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Lấy bút chì dựng thẳng đứng vuông góc 90°, đánh dấu điểm đầu ngón chân dài nhất và điểm gót chân.
                </p>
              </div>

              {/* Bước 3 */}
              <div className="bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 p-4 rounded-xl space-y-2.5 transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-red-950/60 border border-red-500/30 text-[#DC2626] flex items-center justify-center font-mono font-black text-xs">
                    03
                  </div>
                  <Ruler className="w-4 h-4 text-[#DC2626]" />
                </div>
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wide">
                  Bước 3: Dùng thước đo khoảng cách
                </h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Dùng thước kẻ đo khoảng cách giữa 2 điểm (cm) để lấy chính xác chiều dài bàn chân.
                </p>
              </div>
            </div>
          </div>

          {/* ================= 2 CỘT: KHU VỰC 2 (TÍNH TOÁN) & KHU VỰC 3 (KẾT QUẢ) ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* ================= KHU VỰC 2: BỘ TÍNH TOÁN NHANH (7 COLS) ================= */}
            <div className="lg:col-span-7 p-5 sm:p-7 space-y-5 border-b lg:border-b-0 lg:border-r border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-black uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                  <span>KHU VỰC 2 // NHẬP SỐ ĐO & DÁNG CHÂN</span>
                </span>
                <span className="text-[10px] font-mono text-[#DC2626] font-bold">
                  CHUẨN FORM NEWMOS
                </span>
              </div>

              {/* 1. Nhập số đo chiều dài cm: Input trực tiếp & Slider */}
              <div className="bg-neutral-900/70 p-4 rounded-xl border border-neutral-800 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-200 block">
                      Chiều Dài Bàn Chân (Foot Length) *
                    </label>
                    <span className="text-[10px] text-neutral-500">Từ gót chân đến ngón dài nhất</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#141414] border border-neutral-700 px-3 py-1.5 rounded-lg focus-within:border-[#DC2626]">
                    <input
                      type="number"
                      min="20.0"
                      max="27.0"
                      step="0.1"
                      placeholder="0.0"
                      value={footLengthCm}
                      onChange={(e) => handleLengthChange(e.target.value)}
                      className="w-16 bg-transparent font-mono text-base font-black text-[#DC2626] text-right focus:outline-none"
                    />
                    <span className="font-mono text-xs font-bold text-neutral-400">cm</span>
                  </div>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min="21.0"
                  max="26.0"
                  step="0.1"
                  value={footLengthCm || 23.5}
                  onChange={(e) => handleSliderChange(e.target.value)}
                  className="w-full h-2.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#DC2626]"
                />

                <div className="flex justify-between text-[10px] font-mono text-neutral-500 pt-0.5">
                  <span>21.0 cm (Size 36)</span>
                  <span>23.5 cm (Chuẩn 38)</span>
                  <span>26.0 cm (Size 40+)</span>
                </div>
              </div>

              {/* 2. Nhập số đo độ rộng cm (Tùy chọn) */}
              <div className="bg-neutral-900/70 p-4 rounded-xl border border-neutral-800 space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-200 block">
                      Độ Rộng Bàn Chân (Foot Width)
                    </label>
                    <span className="text-[10px] text-neutral-500">Tùy chọn - Hệ thống tự ước tính nếu để trống</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#141414] border border-neutral-700 px-3 py-1 rounded-lg focus-within:border-[#DC2626]">
                    <input
                      type="number"
                      min="7.0"
                      max="14.0"
                      step="0.1"
                      placeholder="VD: 9.8"
                      value={footWidthCm}
                      onChange={(e) => setFootWidthCm(e.target.value)}
                      className="w-16 bg-transparent font-mono text-xs font-bold text-white text-right focus:outline-none"
                    />
                    <span className="font-mono text-xs font-bold text-neutral-400">cm</span>
                  </div>
                </div>
              </div>

              {/* 3. Chọn dáng bàn chân: 3 nút radio thể thao */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Chọn Dáng Bàn Chân Của Bạn
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Option 1: Thon gọn */}
                  <button
                    type="button"
                    onClick={() => setFootShape('SLIM')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      footShape === 'SLIM'
                        ? 'bg-[#181818] border-[#DC2626] ring-1 ring-[#DC2626]/50 shadow-md shadow-red-950/20'
                        : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 text-neutral-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase text-neutral-500">
                        SLIM FIT
                      </span>
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          footShape === 'SLIM' ? 'border-[#DC2626]' : 'border-neutral-600'
                        }`}
                      >
                        {footShape === 'SLIM' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-white">Chân thon gọn</span>
                    <span className="text-[10px] text-neutral-400 mt-0.5">Ôm khít chân</span>
                  </button>

                  {/* Option 2: Tiêu chuẩn */}
                  <button
                    type="button"
                    onClick={() => setFootShape('STANDARD')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      footShape === 'STANDARD'
                        ? 'bg-[#181818] border-[#DC2626] ring-1 ring-[#DC2626]/50 shadow-md shadow-red-950/20'
                        : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 text-neutral-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase text-neutral-500">
                        STANDARD
                      </span>
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          footShape === 'STANDARD' ? 'border-[#DC2626]' : 'border-neutral-600'
                        }`}
                      >
                        {footShape === 'STANDARD' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-white">Chân chuẩn vừa</span>
                    <span className="text-[10px] text-neutral-400 mt-0.5">True to size</span>
                  </button>

                  {/* Option 3: Bè ngang / Mu dày */}
                  <button
                    type="button"
                    onClick={() => setFootShape('WIDE')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      footShape === 'WIDE'
                        ? 'bg-[#181818] border-[#DC2626] ring-1 ring-[#DC2626]/50 shadow-md shadow-red-950/20'
                        : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 text-neutral-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase text-red-400">
                        +1 SIZE
                      </span>
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          footShape === 'WIDE' ? 'border-[#DC2626]' : 'border-neutral-600'
                        }`}
                      >
                        {footShape === 'WIDE' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-white">Chân bè / Mu dày</span>
                    <span className="text-[10px] text-neutral-400 mt-0.5">Tự động tăng size</span>
                  </button>
                </div>
              </div>

              {/* Thông báo lỗi validation */}
              {validationError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* 4. Nút hành động: TÍNH SIZE CỦA BẠN */}
              <button
                type="button"
                disabled={isCalculating || !footLengthCm || Number(footLengthCm) <= 0}
                onClick={handleCalculate}
                className="w-full py-3.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isCalculating ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>ĐANG ĐỐI CHIẾU MATRIX SIZE NEWMOS...</span>
                  </>
                ) : (
                  <>
                    <Flame className="w-4 h-4 fill-white" />
                    <span>TÍNH SIZE CỦA BẠN</span>
                  </>
                )}
              </button>
            </div>

            {/* ================= KHU VỰC 3: KẾT QUẢ & ÁP DỤNG NGAY (5 COLS) ================= */}
            <div className="lg:col-span-5 p-5 sm:p-7 bg-[#0D0D0D] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">
                    KHU VỰC 3 // KẾT QUẢ GỢI Ý
                  </span>
                  <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-500/40 text-[10px] font-mono text-[#DC2626] font-bold">
                    NEWMOS SIZE MATRIX
                  </span>
                </div>

                {calculationResult ? (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* Badge Size gợi ý in to nổi bật */}
                    <div className="bg-gradient-to-br from-neutral-900 to-black p-5 rounded-2xl border-2 border-[#DC2626]/40 text-center relative overflow-hidden shadow-lg shadow-red-950/30">
                      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-red-600/15 blur-2xl pointer-events-none" />
                      <span className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-widest block mb-1">
                        KẾT QUẢ TÍNH TOÁN
                      </span>
                      <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight my-1">
                        SIZE PHÙ HỢP: <span className="text-[#DC2626]">{calculationResult.recommendedSize}</span>
                      </div>
                      <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{calculationResult.fitStatus}</span>
                      </div>
                    </div>

                    {/* Dòng ghi chú mức độ vừa vặn và lời khuyên form giày */}
                    <div className="space-y-2 text-xs">
                      <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 leading-relaxed text-[11px]">
                        <strong className="text-white block mb-1 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-[#DC2626]" />
                          <span>Lời khuyên từ NewMos:</span>
                        </strong>
                        {calculationResult.advice}
                      </div>

                      {/* Bảng quy chuẩn size 36 - 40 */}
                      <div className="p-3 rounded-xl bg-neutral-900/50 border border-neutral-800 text-[10px] font-mono text-neutral-400 space-y-1">
                        <div className="text-neutral-300 font-bold uppercase">
                          Tham chiếu dải đo chuẩn NewMos:
                        </div>
                        <div className="grid grid-cols-5 gap-1 text-center pt-1">
                          <div className={`p-1 rounded ${calculationResult.recommendedSize === 36 ? 'bg-red-600 text-white font-bold' : 'bg-neutral-800'}`}>
                            36 (&le;22.5)
                          </div>
                          <div className={`p-1 rounded ${calculationResult.recommendedSize === 37 ? 'bg-red-600 text-white font-bold' : 'bg-neutral-800'}`}>
                            37 (23.0)
                          </div>
                          <div className={`p-1 rounded ${calculationResult.recommendedSize === 38 ? 'bg-red-600 text-white font-bold' : 'bg-neutral-800'}`}>
                            38 (23.5)
                          </div>
                          <div className={`p-1 rounded ${calculationResult.recommendedSize === 39 ? 'bg-red-600 text-white font-bold' : 'bg-neutral-800'}`}>
                            39 (24.0)
                          </div>
                          <div className={`p-1 rounded ${calculationResult.recommendedSize === 40 ? 'bg-red-600 text-white font-bold' : 'bg-neutral-800'}`}>
                            40 (&ge;24.5)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ================= EMPTY STATE KHI CHƯA CÓ KẾT QUẢ ================= */
                  <div className="text-center py-10 px-4 space-y-4 rounded-2xl bg-neutral-900/40 border border-neutral-800/80 animate-in fade-in duration-200">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-red-950/40 border border-red-500/20 text-[#DC2626] flex items-center justify-center">
                      <Footprints className="w-7 h-7" />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-sm font-black uppercase text-white tracking-wide">
                        Chưa Có Kết Quả Tính Size
                      </h4>
                      <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
                        Bạn chưa cập nhật số đo bàn chân. Hãy nhập số đo chiều dài (cm) và chọn dáng bàn chân ở Khu vực 2, sau đó nhấn <strong className="text-red-400">"TÍNH SIZE CỦA BẠN"</strong> để NewMos gợi ý size giày chuẩn xác nhất.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800/80 text-[10px] font-mono text-neutral-400">
                      <Info className="w-3.5 h-3.5 text-[#DC2626]" />
                      <span>Dải đo chuẩn: 21.0 cm - 26.0 cm (Size 36 - 40)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Nút bấm: Áp dụng size & Lưu hồ sơ */}
              <div className="pt-2 border-t border-neutral-800 space-y-2">
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={!calculationResult || isSaving}
                  className="w-full py-3.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>ĐANG LƯU HỒ SƠ...</span>
                    </>
                  ) : (
                    <>
                      <span>{isAuthenticated ? 'Lưu Hồ Sơ & Áp Dụng Size' : 'Áp Dụng Size Này Ngay'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-neutral-500">
                  {calculationResult?.recommendedSize
                    ? `Tự động chọn size ${calculationResult.recommendedSize} trên trang chi tiết sản phẩm`
                    : 'Nhập số đo để tự động xác định size chuẩn NewMos'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SizeGuideModal;
