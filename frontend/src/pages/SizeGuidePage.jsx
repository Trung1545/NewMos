import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Sparkles,
  Ruler,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Truck,
  ArrowRight,
  ChevronRight,
  Info,
  Flame,
} from 'lucide-react';
import { useAIStore } from '../stores/useAIStore';

export function SizeGuidePage() {
  const location = useLocation();
  const { setModalOpen, resetAI } = useAIStore();

  // Xác định tab mặc định dựa trên URL (/policy hay /size-guide)
  const isPolicyRoute = location.pathname.includes('/policy');
  const [activeTab, setActiveTab] = useState(isPolicyRoute ? 'policy' : 'sizing');

  useEffect(() => {
    if (location.pathname.includes('/policy')) {
      setActiveTab('policy');
    } else {
      setActiveTab('sizing');
    }
  }, [location.pathname]);

  const handleOpenSizeModal = () => {
    resetAI();
    setModalOpen(true);
  };

  // Bảng quy đổi size chuẩn NewMos (Size 36 - 40)
  const newmosSizeTable = [
    { eu: '36', usMen: '4.5', usWomen: '6.0', cm: '≤ 22.5 cm', advice: 'Bàn chân thon nhỏ / Chuẩn size 36' },
    { eu: '37', usMen: '5.0', usWomen: '6.5', cm: '22.6 - 23.0 cm', advice: 'Chuẩn vừa vặn / Chân bè mu dày chọn 38' },
    { eu: '38', usMen: '6.0', usWomen: '7.5', cm: '23.1 - 23.5 cm', advice: 'Size tiêu chuẩn phổ biến nhất / Chân bè chọn 39' },
    { eu: '39', usMen: '6.5', usWomen: '8.0', cm: '23.6 - 24.0 cm', advice: 'Chuẩn vừa vặn / Chân bè mu dày chọn 40' },
    { eu: '40', usMen: '7.0', usWomen: '8.5', cm: '24.1 - 24.5 cm', advice: 'Size tối đa của dòng NewMos' },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-neutral-500 font-sans">
          <Link to="/" className="hover:text-[#DC2626] transition-colors">
            Trang chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#0A0A0A] font-bold">
            {activeTab === 'sizing' ? 'Hướng dẫn đo chân & Tính size chuẩn' : 'Chính sách bảo hành & Đổi trả'}
          </span>
        </nav>

        {/* Header chung */}
        <div className="bg-[#0A0A0A] text-white rounded-xl p-6 sm:p-10 relative overflow-hidden shadow-xs">
          <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-red-600/20 blur-2xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest block mb-1">
              TRUNG TÂM HỖ TRỢ KỸ THUẬT & KHÁCH HÀNG // NEWMOS
            </span>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              {activeTab === 'sizing'
                ? 'Hướng Dẫn Đo Chân & Tính Size Chuẩn'
                : 'Chính Sách Đổi Trả & Bảo Hành 30 Ngày'}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-2 leading-relaxed">
              Giải pháp chọn giày vừa vặn 100% ngay lần đầu mua sắm cùng chính sách bảo hộ quyền lợi khách hàng tuyệt đối.
            </p>
          </div>
        </div>

        {/* Thanh chuyển Tab */}
        <div className="flex border-b border-neutral-200 bg-white rounded-xl p-1.5 shadow-2xs">
          <button
            onClick={() => setActiveTab('sizing')}
            className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'sizing'
                ? 'bg-[#DC2626] text-white shadow-sm'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-50'
            }`}
          >
            <Ruler className="w-4 h-4" />
            <span>Hướng Dẫn Chọn Size & AI</span>
          </button>

          <button
            onClick={() => setActiveTab('policy')}
            className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'policy'
                ? 'bg-[#DC2626] text-white shadow-sm'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-50'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Chính Sách Đổi Trả 30 Ngày</span>
          </button>

          <button
            onClick={() => setActiveTab('warranty')}
            className={`hidden sm:flex flex-1 py-3 px-4 rounded-lg text-xs font-bold uppercase tracking-wider items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'warranty'
                ? 'bg-[#DC2626] text-white shadow-sm'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Cam Kết Chính Hãng</span>
          </button>
        </div>

        {/* ================= TAB 1: HƯỚNG DẪN CHỌN SIZE & AI ================= */}
        {activeTab === 'sizing' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Banner kêu gọi trải nghiệm Đo & Tính Size Chuẩn */}
            <div className="bg-gradient-to-r from-neutral-900 to-black text-white rounded-xl p-6 sm:p-8 border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-950/80 border border-red-500/30 text-red-400 text-[10px] font-mono font-bold uppercase">
                  <Sparkles className="w-3.5 h-3.5" />
                  CÔNG NGHỆ CHUẨN XÁC
                </span>
                <h3 className="text-xl sm:text-2xl font-black uppercase">
                  Bộ Tính Size Chân Chuẩn Xác NewMos
                </h3>
                <p className="text-xs text-neutral-400 max-w-lg leading-relaxed">
                  Đo chiều dài chân theo hướng dẫn 3 bước và nhập số đo cm để hệ thống tự động đối chiếu ma trận form giày chuẩn NewMos, loại bỏ hoàn toàn rủi ro chọn nhầm size.
                </p>
              </div>

              <button
                onClick={handleOpenSizeModal}
                className="px-6 py-3.5 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-600/40 flex items-center gap-2 shrink-0 transition-all cursor-pointer"
              >
                <Ruler className="w-4 h-4" />
                <span>Mở Bộ Tính Size NewMos</span>
              </button>
            </div>

            {/* Bảng quy đổi kích thước theo từng thương hiệu */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-4">
                <div>
                  <h3 className="text-base font-black text-[#0A0A0A] uppercase tracking-wider">
                    Bảng Quy Đổi Kích Cỡ Chuẩn NewMos (Size 36 - 40)
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Thông số kích thước chiều dài bàn chân chuẩn phom giày thể thao NewMos Runner Pro
                  </p>
                </div>

                {/* Badge Thương hiệu NewMos duy nhất */}
                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1.5 rounded-lg bg-[#DC2626] text-white text-xs font-bold font-mono uppercase tracking-wider shadow-sm">
                    NEWMOS RUNNER PRO
                  </span>
                </div>
              </div>

              {/* Bảng Dữ Liệu */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left font-sans">
                  <thead>
                    <tr className="bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-neutral-600 border-y border-neutral-200">
                      <th className="py-3 px-4">Size EU (Việt Nam)</th>
                      <th className="py-3 px-4">US Nam (Men)</th>
                      <th className="py-3 px-4">US Nữ (Women)</th>
                      <th className="py-3 px-4 font-mono text-[#DC2626]">Chiều Dài Chân (CM)</th>
                      <th className="py-3 px-4">Khuyến Nghị Dáng Chân</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-mono">
                    {newmosSizeTable.map((row, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-neutral-50/80 transition-colors"
                      >
                        <td className="py-3 px-4 font-bold text-neutral-900">{row.eu}</td>
                        <td className="py-3 px-4 text-neutral-600">{row.usMen}</td>
                        <td className="py-3 px-4 text-neutral-600">{row.usWomen}</td>
                        <td className="py-3 px-4 font-bold text-[#DC2626]">{row.cm}</td>
                        <td className="py-3 px-4 font-sans text-neutral-500 text-[11px]">
                          {row.advice}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3 Bước tự đo chân thủ công tại nhà */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
              <h3 className="text-base font-black text-[#0A0A0A] uppercase tracking-wider">
                Cách Tự Đo Chiều Dài Bàn Chân Tại Nhà (3 Bước Đơn Giản)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0A0A0A] text-white flex items-center justify-center font-mono font-bold text-xs">
                    01
                  </div>
                  <h4 className="text-xs font-bold text-[#0A0A0A] uppercase">
                    Đặt Chân Lên Tờ Giấy Trắng
                  </h4>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Đặt một tờ giấy A4 cố định trên sàn nhà sát mép tường. Đặt bàn chân đứng thẳng lên giấy, gót chân tựa nhẹ vào tường.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0A0A0A] text-white flex items-center justify-center font-mono font-bold text-xs">
                    02
                  </div>
                  <h4 className="text-xs font-bold text-[#0A0A0A] uppercase">
                    Đánh Dấu Điểm Dài Nhất
                  </h4>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Dùng bút chì giữ thẳng đứng vuông góc 90° để vạch một đường ngang ở đầu ngón chân dài nhất và một vạch sau gót.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
                  <div className="w-8 h-8 rounded-lg bg-[#DC2626] text-white flex items-center justify-center font-mono font-bold text-xs">
                    03
                  </div>
                  <h4 className="text-xs font-bold text-[#0A0A0A] uppercase">
                    Đo Chiều Dài & Đối Chiếu
                  </h4>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Dùng thước đo khoảng cách giữa hai vạch (cm). Cộng thêm 0.5 cm nếu mu bàn chân bè ngang dày, sau đó tra vào bảng size ở trên.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: CHÍNH SÁCH ĐỔI TRẢ 30 NGÀY ================= */}
        {(activeTab === 'policy' || activeTab === 'warranty') && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Thẻ Điểm Nhấn Đổi Trả */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-50 text-[#DC2626] flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#0A0A0A] uppercase tracking-tight">
                    Chính Sách Đổi Size Miễn Phí Trong 30 Ngày
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Áp dụng cho toàn bộ đơn hàng giày thể thao mua trực tuyến tại NewMos
                  </p>
                </div>
              </div>

              {/* 3 Cam kết cốt lõi */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 space-y-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h4 className="text-xs font-bold uppercase text-[#0A0A0A]">100% Miễn Phí Ship</h4>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    NewMos hỗ trợ toàn bộ phí vận chuyển 2 chiều khi quý khách có nhu cầu đổi sang kích cỡ vừa vặn hơn.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 space-y-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h4 className="text-xs font-bold uppercase text-[#0A0A0A]">Đổi Tận Nhà Trong 48H</h4>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Bưu tá sẽ mang đôi giày mới đến giao tận nhà và thu hồi lại đôi giày cũ cùng thời điểm.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 space-y-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h4 className="text-xs font-bold uppercase text-[#0A0A0A]">Hoàn Tiền Nếu Hết Size</h4>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Nếu kích cỡ quý khách muốn đổi đã hết hàng trong hệ thống, chúng tôi sẽ hoàn trả 100% tiền qua tài khoản ngân hàng.
                  </p>
                </div>
              </div>

              {/* Điều kiện đổi trả */}
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 space-y-3 text-xs font-sans">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 block">
                  Điều Kiện Áp Dụng Đổi Trả:
                </span>
                <ul className="space-y-2 text-neutral-600 list-disc list-inside">
                  <li>Sản phẩm còn nguyên tem mác, hóa đơn và hộp giày chính hãng (không rách nát, dán băng keo đè lên hộp).</li>
                  <li>Giày chưa qua sử dụng ngoài trời, đế giày sạch sẽ không có vết mòn, bụi bẩn hoặc trầy xước.</li>
                  <li>Thời gian đổi trả không vượt quá 30 ngày kể từ ngày bưu tá giao hàng thành công.</li>
                </ul>
              </div>
            </div>

            {/* Cam Kết Hàng Chính Hãng & Bảo Hành */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-50 text-[#DC2626] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#0A0A0A] uppercase tracking-tight">
                    Cam Kết Authentic 100% & Bảo Hành Keo Chỉ Trọn Đời
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Tiêu chuẩn kiểm định nghiêm ngặt bảo vệ quyền lợi người yêu giày
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-neutral-600 leading-relaxed font-sans">
                <p>
                  <strong className="text-neutral-900">Bồi thường 200%:</strong> Toàn bộ sản phẩm được phân phối bởi NewMos đều nhập khẩu chính ngạch từ các đại diện thương hiệu chính thức (Nike Vietnam, Adidas Vietnam, Puma, Jordan Brand). Nếu phát hiện hàng nhái, khách hàng sẽ được hoàn tiền gấp đôi ngay lập tức.
                </p>
                <p>
                  <strong className="text-neutral-900">Bảo hành keo dán & may chỉ miễn phí:</strong> Quý khách được hỗ trợ sửa chữa, dán lại keo nhiệt và may viền chỉ trọn đời cho mọi sản phẩm giày thể thao khi mua tại hệ thống.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cụm liên hệ tư vấn */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-[#0A0A0A] uppercase">
              Vẫn Băn Khoăn Về Kích Cỡ Giày Phù Hợp?
            </h4>
            <p className="text-xs text-neutral-500 mt-0.5">
              Đội ngũ chuyên viên Sneakerhead NewMos sẵn sàng hỗ trợ bạn qua Hotline hoặc Zalo.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="tel:19008888"
              className="px-5 py-2.5 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Gọi Hotline 1900 8888
            </a>
            <Link
              to="/shop"
              className="px-5 py-2.5 rounded-lg border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Xem Sản Phẩm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SizeGuidePage;
