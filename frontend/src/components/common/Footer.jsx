import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  Send,
  CheckCircle2,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  CreditCard,
  Lock,
} from 'lucide-react';

export function Footer() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setIsSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#0A0A0A] text-[#9CA3AF] border-t border-[#262626] font-sans antialiased">
      {/* Khối Nội Dung Chính 4 Cột */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Cột 1: Thông tin thương hiệu, slogan và mạng xã hội (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform duration-200">
                <Flame className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="font-display font-black text-2xl tracking-wider leading-none text-white">
                NEW<span className="text-red-600">MOS</span>
              </span>
            </Link>

            <p className="text-xs font-semibold text-white leading-relaxed pr-4">
              NewMos – Bước Chạy Đột Phá, Chuẩn Size Cùng AI
            </p>
            <p className="text-xs text-[#9CA3AF] leading-relaxed pr-4">
              Hệ thống phân phối giày thể thao và sneaker chính hãng NewMos. Tích hợp bộ tính size thông minh & Trợ lý NewMos AI tư vấn form giày chuẩn xác 100%.
            </p>

            {/* Thông tin liên hệ nhanh */}
            <div className="space-y-2 pt-2 text-xs text-neutral-300 font-sans">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#DC2626] shrink-0" />
                <span>Số 123 Đường Thời Trang Thể Thao, Quận 1, TP. Hồ Chí Minh</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#DC2626] shrink-0" />
                <span className="font-mono">Hotline: 1900 8888 (08:00 - 22:00)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#DC2626] shrink-0" />
                <span>Mở cửa 7 ngày trong tuần: 08:30 - 21:30</span>
              </div>
            </div>

            {/* Các Kênh Mạng Xã Hội */}
            <div className="pt-2 flex items-center gap-3">
              {[
                { name: 'Facebook', href: 'https://facebook.com', icon: 'FB' },
                { name: 'Instagram', href: 'https://instagram.com', icon: 'IG' },
                { name: 'TikTok', href: 'https://tiktok.com', icon: 'TT' },
                { name: 'YouTube', href: 'https://youtube.com', icon: 'YT' },
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-[#DC2626] hover:text-white text-neutral-400 border border-neutral-800 flex items-center justify-center text-[11px] font-bold font-mono transition-colors"
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Cột 2: Danh mục mua sắm (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-neutral-800 pb-2">
              Danh Mục Mua Sắm
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/shop?brand=Nike" className="hover:text-white transition-colors">
                  Nike Sneaker
                </Link>
              </li>
              <li>
                <Link to="/shop?brand=Jordan" className="hover:text-white transition-colors">
                  Jordan Retro
                </Link>
              </li>
              <li>
                <Link to="/shop?category=running" className="hover:text-white transition-colors">
                  Giày Chạy Bộ (Running)
                </Link>
              </li>
              <li>
                <Link to="/shop?category=lifestyle" className="hover:text-white transition-colors">
                  Lifestyle & Streetwear
                </Link>
              </li>
              <li>
                <Link to="/shop?sale=true" className="text-[#DC2626] font-bold hover:text-red-400 transition-colors">
                  Flash Sale - Giảm Đến 50%
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Hỗ trợ khách hàng (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-neutral-800 pb-2">
              Hỗ Trợ Khách Hàng
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/policy" className="hover:text-white transition-colors">
                  Chính sách đổi trả 30 ngày miễn phí
                </Link>
              </li>
              <li>
                <Link to="/size-guide" className="hover:text-white transition-colors text-red-400 font-semibold flex items-center gap-1">
                  <span>Hướng dẫn đo size bằng AI</span>
                </Link>
              </li>
              <li>
                <Link to="/order-tracking" className="hover:text-white transition-colors">
                  Tra cứu tình trạng đơn hàng
                </Link>
              </li>
              <li>
                <Link to="/policy" className="hover:text-white transition-colors">
                  Cam kết bảo hành chính hãng 100%
                </Link>
              </li>
              <li>
                <Link to="/policy" className="hover:text-white transition-colors">
                  Chính sách giao hàng siêu tốc 2H
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 4: Form đăng ký nhận tin khuyến mãi (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-neutral-800 pb-2">
              Đăng Ký Nhận Tin
            </h4>
            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              Nhận voucher 200.000₫ cho đơn hàng đầu tiên và cập nhật sớm các mẫu giày Limited Drop.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email nhận ưu đãi..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-[#DC2626] font-sans"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 px-3 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center justify-center"
                  aria-label="Gửi"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              {isSubscribed && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Đăng ký thành công! Kiểm tra hộp thư của bạn.</span>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Dòng Bản Quyền & Chứng Nhận Thanh Toán An Toàn */}
        <div className="pt-8 mt-8 border-t border-[#262626] flex flex-col sm:flex-row items-center justify-between text-[11px] gap-4">
          <div className="text-neutral-500 text-center sm:text-left font-mono">
            © 2026 NewMos. All rights reserved.
          </div>

          {/* Chứng nhận thanh toán an toàn */}
          <div className="flex items-center gap-3 text-neutral-400 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-500 font-semibold">
              <Lock className="w-3 h-3" /> SSL 256-bit
            </span>
            <span className="text-neutral-600">|</span>
            <span>VietQR</span>
            <span className="text-neutral-600">•</span>
            <span>Visa / Mastercard</span>
            <span className="text-neutral-600">•</span>
            <span>COD Giao Hàng Thu Tiền</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
