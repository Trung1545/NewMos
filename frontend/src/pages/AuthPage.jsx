import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Flame,
  Lock,
  Mail,
  Phone,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Gift,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { authService } from '../services/authService';

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errors, setErrors] = useState({});

  // Login Form State
  const [loginData, setLoginData] = useState({
    identifier: '',
    password: '',
    remember: true,
  });

  // Register Form State
  const [registerData, setRegisterData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: true,
  });

  // Clear specific error on field change
  const handleLoginChange = (field, value) => {
    setLoginData((prev) => ({ ...prev, [field]: value }));
    if (errors[field] || errors.general) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        delete next.general;
        return next;
      });
    }
  };

  const handleRegisterChange = (field, value) => {
    setRegisterData((prev) => ({ ...prev, [field]: value }));
    if (errors[field] || errors.general) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        delete next.general;
        return next;
      });
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setErrors({});
    setSuccessMsg('');
  };

  // Quick fill sample credentials for testing
  const fillSampleAccount = (type) => {
    if (type === 'admin') {
      setLoginData({
        identifier: 'admin@shoestore.com',
        password: 'admin123',
        remember: true,
      });
    } else {
      setLoginData({
        identifier: 'user@shoestore.com',
        password: 'user123',
        remember: true,
      });
    }
    setErrors({});
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!loginData.identifier.trim()) {
      newErrors.identifier = 'Vui lòng nhập email hoặc số điện thoại';
    }
    if (!loginData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});
    setSuccessMsg('');

    try {
      const response = await authService.login({
        identifier: loginData.identifier.trim(),
        password: loginData.password,
      });

      const resData = response?.data || response;
      const accessToken = resData?.accessToken || resData?.token;
      const user = resData?.user || resData;

      if (!accessToken) {
        throw new Error('Không nhận được token xác thực từ máy chủ.');
      }

      // Lưu token và thông tin user vào Zustand store & localStorage
      login(accessToken, user);

      setSuccessMsg('Đăng nhập thành công! Đang chuyển hướng...');

      setTimeout(() => {
        const destination = location.state?.from?.pathname || location.state?.from || '/';
        navigate(destination, { replace: true });
      }, 700);
    } catch (err) {
      console.error('Lỗi đăng nhập:', err);
      const serverMsg = err.response?.data?.message || err.message || '';

      if (serverMsg.includes('Mật khẩu') || serverMsg.includes('Bad credentials') || serverMsg.includes('không chính xác')) {
        setErrors({
          password: 'Sai mật khẩu hoặc thông tin đăng nhập không chính xác',
        });
      } else if (serverMsg.includes('không tồn tại') || serverMsg.includes('User not found')) {
        setErrors({
          identifier: 'Tài khoản không tồn tại trong hệ thống',
        });
      } else {
        setErrors({
          general: serverMsg || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!registerData.fullName.trim()) {
      newErrors.fullName = 'Họ và tên không được để trống';
    }
    if (!registerData.phone.trim()) {
      newErrors.phone = 'Số điện thoại không được để trống';
    } else if (!/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(registerData.phone.trim())) {
      newErrors.phone = 'Số điện thoại không hợp lệ (gồm 10 chữ số)';
    }

    if (!registerData.email.trim()) {
      newErrors.email = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email.trim())) {
      newErrors.email = 'Định dạng email không hợp lệ';
    }

    if (!registerData.password) {
      newErrors.password = 'Mật khẩu không được để trống';
    } else if (registerData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải chứa ít nhất 6 ký tự';
    }

    if (!registerData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (registerData.password !== registerData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp';
    }

    if (!registerData.agreeTerms) {
      newErrors.terms = 'Bạn phải đồng ý với Điều khoản và Chính sách bảo mật';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});
    setSuccessMsg('');

    try {
      const response = await authService.register({
        fullName: registerData.fullName.trim(),
        phone: registerData.phone.trim(),
        email: registerData.email.trim().toLowerCase(),
        password: registerData.password,
      });

      const resData = response?.data || response;
      const accessToken = resData?.accessToken || resData?.token;
      const user = resData?.user || resData;

      if (accessToken) {
        login(accessToken, user);
      }

      setSuccessMsg('Đăng ký thành công! Đang chuyển hướng...');

      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1000);
    } catch (err) {
      console.error('Lỗi đăng ký:', err);
      const serverMsg = err.response?.data?.message || err.message || '';

      if (serverMsg.includes('email') || serverMsg.includes('Email')) {
        setErrors({
          email: 'Email đã tồn tại trong hệ thống. Vui lòng dùng email khác.',
        });
      } else if (serverMsg.includes('phone') || serverMsg.includes('thoại')) {
        setErrors({
          phone: 'Số điện thoại đã được sử dụng bởi tài khoản khác.',
        });
      } else {
        setErrors({
          general: serverMsg || 'Đăng ký không thành công. Vui lòng thử lại sau.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#F9FAFB] py-10 sm:py-16 flex items-center justify-center px-4 sm:px-6">
      <div className="max-w-4xl w-full bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-12">
        {/* Cột Trái: Banner Thương Hiệu & Đặc Quyền Thành Viên (5 cols) */}
        <div className="md:col-span-5 bg-[#0A0A0A] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-neutral-800">
          {/* Subtle glow background */}
          <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-red-600/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center shadow-lg shadow-red-600/30">
                <Flame className="w-5 h-5 text-white fill-white" />
              </div>
              <div className="flex items-center tracking-wider leading-none font-display font-black text-2xl">
                <span className="text-white">NEW</span>
                <span className="text-[#DC2626]">MOS</span>
              </div>
            </Link>

            <div>
              <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest block mb-1">
                NEWMOS MEMBERS CLUB // 2026
              </span>
              <h2 className="text-2xl font-black uppercase text-white leading-tight">
                Gia Nhập Cộng Đồng Sneakerhead AI
              </h2>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                Tạo tài khoản để mở khóa trải nghiệm mua sắm thông minh, lưu trữ hồ sơ đo size chân 3D và săn trước các phiên bản giới hạn.
              </p>
            </div>

            {/* Danh sách đặc quyền hội viên */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-md bg-red-950/50 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
                  <Gift className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase">Voucher 200.000₫</h4>
                  <p className="text-[11px] text-neutral-400">Áp dụng ngay cho đơn hàng đầu tiên</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-md bg-red-950/50 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase">Hồ Sơ Size Bàn Chân Thông Minh</h4>
                  <p className="text-[11px] text-neutral-400">Tự động tính toán & gợi ý size giày vừa vặn từng milimet</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-md bg-red-950/50 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase">Săn Drop Giới Hạn</h4>
                  <p className="text-[11px] text-neutral-400">Ưu tiên thông báo khi có đợt mở bán Retro</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 mt-8 border-t border-neutral-800 text-[11px] text-neutral-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Cam kết bảo mật dữ liệu chuẩn mã hóa SSL 256-bit</span>
          </div>
        </div>

        {/* Cột Phải: Form Đăng Nhập / Đăng Ký (7 cols) */}
        <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          {/* Chuyển tab Đăng nhập & Đăng ký */}
          <div className="flex border-b border-neutral-200 mb-6">
            <button
              onClick={() => switchTab('login')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'border-[#DC2626] text-[#DC2626]'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              Đăng Nhập
            </button>
            <button
              onClick={() => switchTab('register')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'border-[#DC2626] text-[#DC2626]'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              Đăng Ký Tài Khoản
            </button>
          </div>

          {/* Thông báo thành công */}
          {successMsg && (
            <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Thông báo lỗi tổng quát */}
          {errors.general && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-[#DC2626] text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
              <span>{errors.general}</span>
            </div>
          )}

          {activeTab === 'login' ? (
            /* ================= FORM ĐĂNG NHẬP ================= */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Email hoặc Số điện thoại
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={loginData.identifier}
                    onChange={(e) => handleLoginChange('identifier', e.target.value)}
                    placeholder="name@example.com hoặc 0901234567"
                    className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-xs focus:outline-none transition-colors font-sans ${
                      errors.identifier
                        ? 'border-[#DC2626] bg-red-50/30 focus:border-[#DC2626]'
                        : 'border-neutral-300 focus:border-[#DC2626]'
                    }`}
                  />
                </div>
                {errors.identifier && (
                  <p className="mt-1 text-xs text-[#DC2626] font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.identifier}
                  </p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                    Mật khẩu
                  </label>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      setErrors({
                        general: 'Để đặt lại mật khẩu, vui lòng liên hệ Hotline CSKH NewMos 1900 8888 hoặc gửi email tới support@newmos.vn.',
                      });
                    }}
                    className="text-[11px] font-semibold text-[#DC2626] hover:underline"
                  >
                    Quên mật khẩu?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginData.password}
                    onChange={(e) => handleLoginChange('password', e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className={`w-full pl-9 pr-10 py-2.5 rounded-lg border text-xs focus:outline-none transition-colors font-sans ${
                      errors.password
                        ? 'border-[#DC2626] bg-red-50/30 focus:border-[#DC2626]'
                        : 'border-neutral-300 focus:border-[#DC2626]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-[#DC2626] font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={loginData.remember}
                    onChange={(e) => setLoginData({ ...loginData, remember: e.target.checked })}
                    className="w-4 h-4 rounded text-[#DC2626] focus:ring-red-500 border-neutral-300 cursor-pointer"
                  />
                  <span className="text-xs text-neutral-600 font-sans">Ghi nhớ đăng nhập</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-red-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Đang xác thực tài khoản...</span>
                ) : (
                  <>
                    <span>ĐĂNG NHẬP NGAY</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Gợi ý tài khoản demo */}
              <div className="pt-2 p-3 rounded-lg bg-neutral-50 border border-neutral-200">
                <span className="text-[11px] font-bold text-neutral-500 uppercase block mb-1.5">
                  Tài khoản mẫu thử nghiệm:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fillSampleAccount('admin')}
                    className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-mono font-semibold transition-colors cursor-pointer"
                  >
                    Admin: admin@shoestore.com
                  </button>
                  <button
                    type="button"
                    onClick={() => fillSampleAccount('user')}
                    className="px-2.5 py-1 rounded bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-[11px] font-mono font-semibold transition-colors cursor-pointer"
                  >
                    User: user@shoestore.com
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* ================= FORM ĐĂNG KÝ ================= */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Họ và tên <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={registerData.fullName}
                    onChange={(e) => handleRegisterChange('fullName', e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className={`w-full pl-9 pr-3 py-2 rounded-lg border text-xs focus:outline-none transition-colors font-sans ${
                      errors.fullName
                        ? 'border-[#DC2626] bg-red-50/30 focus:border-[#DC2626]'
                        : 'border-neutral-300 focus:border-[#DC2626]'
                    }`}
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-xs text-[#DC2626] font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Số điện thoại <span className="text-[#DC2626]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      value={registerData.phone}
                      onChange={(e) => handleRegisterChange('phone', e.target.value)}
                      placeholder="0901234567"
                      className={`w-full pl-9 pr-3 py-2 rounded-lg border text-xs focus:outline-none transition-colors font-sans ${
                        errors.phone
                          ? 'border-[#DC2626] bg-red-50/30 focus:border-[#DC2626]'
                          : 'border-neutral-300 focus:border-[#DC2626]'
                      }`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-xs text-[#DC2626] font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Địa chỉ Email <span className="text-[#DC2626]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={registerData.email}
                      onChange={(e) => handleRegisterChange('email', e.target.value)}
                      placeholder="name@gmail.com"
                      className={`w-full pl-9 pr-3 py-2 rounded-lg border text-xs focus:outline-none transition-colors font-sans ${
                        errors.email
                          ? 'border-[#DC2626] bg-red-50/30 focus:border-[#DC2626]'
                          : 'border-neutral-300 focus:border-[#DC2626]'
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-[#DC2626] font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Mật khẩu khởi tạo <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={registerData.password}
                    onChange={(e) => handleRegisterChange('password', e.target.value)}
                    placeholder="Ít nhất 6 ký tự..."
                    className={`w-full pl-9 pr-10 py-2 rounded-lg border text-xs focus:outline-none transition-colors font-sans ${
                      errors.password
                        ? 'border-[#DC2626] bg-red-50/30 focus:border-[#DC2626]'
                        : 'border-neutral-300 focus:border-[#DC2626]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-[#DC2626] font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Xác nhận lại mật khẩu <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={registerData.confirmPassword}
                    onChange={(e) => handleRegisterChange('confirmPassword', e.target.value)}
                    placeholder="Nhập lại mật khẩu..."
                    className={`w-full pl-9 pr-10 py-2 rounded-lg border text-xs focus:outline-none transition-colors font-sans ${
                      errors.confirmPassword
                        ? 'border-[#DC2626] bg-red-50/30 focus:border-[#DC2626]'
                        : 'border-neutral-300 focus:border-[#DC2626]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-[#DC2626] font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={registerData.agreeTerms}
                    onChange={(e) => handleRegisterChange('agreeTerms', e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-[#DC2626] focus:ring-red-500 border-neutral-300 cursor-pointer"
                  />
                  <span className="text-[11px] text-neutral-600 font-sans leading-tight">
                    Tôi đồng ý với{' '}
                    <Link to="/policy" className="text-[#DC2626] underline font-bold">
                      Điều khoản dịch vụ
                    </Link>{' '}
                    và{' '}
                    <Link to="/policy" className="text-[#DC2626] underline font-bold">
                      Chính sách bảo mật
                    </Link>{' '}
                    của NewMos
                  </span>
                </label>
                {errors.terms && (
                  <p className="mt-1 text-xs text-[#DC2626] font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.terms}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-red-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Đang khởi tạo tài khoản...</span>
                ) : (
                  <>
                    <span>TẠO TÀI KHOẢN // NHẬN 200K</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
