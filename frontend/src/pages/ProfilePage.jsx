import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  User,
  Package,
  ShoppingBag,
  Truck,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  ArrowRight,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  X,
  Filter,
  Ruler,
  Footprints,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  MapPin,
  Plus,
  Trash2,
  Edit3,
  Camera,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  CreditCard,
  Building,
  CheckCheck,
  LayoutDashboard,
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useCartStore } from '../stores/useCartStore';
import { useAIStore } from '../stores/useAIStore';
import { useChatbotStore } from '../stores/useChatbotStore';
import { SizeGuideModal } from '../components/size/SizeGuideModal';
import { orderService } from '../services/orderService';
import { userService } from '../services/userService';
import { aiService } from '../services/aiService';
import { formatCurrency } from '../lib/utils';

export function ProfilePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Xác định tab từ query param hoặc pathname
  const getResolvedTab = useCallback(() => {
    const searchParams = new URLSearchParams(location.search);
    const queryTab = searchParams.get('tab');
    if (queryTab) {
      if (['profile', 'account'].includes(queryTab)) return 'profile';
      if (['security', 'password'].includes(queryTab)) return 'security';
      if (['addresses', 'address'].includes(queryTab)) return 'addresses';
      if (['orders', 'my-orders'].includes(queryTab)) return 'orders';
      if (['size-fit', 'ai-fit'].includes(queryTab)) return 'size-fit';
      return queryTab;
    }
    if (location.pathname.includes('my-orders') || location.pathname.includes('orders')) {
      return 'orders';
    }
    return 'profile';
  }, [location.search, location.pathname]);

  const [activeTab, setActiveTab] = useState(getResolvedTab);
  const { user, role, isAuthenticated, updateUser, logout } = useAuthStore();
  const isAdmin = role === 'ROLE_ADMIN' || user?.roles?.includes('ROLE_ADMIN') || user?.role === 'ROLE_ADMIN';

  // =========================================================================
  // 1. STATE THÔNG TIN CÁ NHÂN (PROFILE DETAILS)
  // =========================================================================
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    gender: user?.gender || 'MALE',
    dateOfBirth: user?.dateOfBirth || '',
    address: user?.address || '',
    avatarUrl: user?.avatarUrl || '',
    createdAt: user?.createdAt || '',
  });
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // =========================================================================
  // 2. STATE ĐỔI MẬT KHẨU (SECURITY / CHANGE PASSWORD)
  // =========================================================================
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');
  const [logoutCountdown, setLogoutCountdown] = useState(null);

  // =========================================================================
  // 3. STATE SỔ ĐỊA CHỈ (ADDRESS BOOK)
  // =========================================================================
  const getInitialAddresses = () => {
    try {
      const storageKey = `newmos_addresses_${user?.id || 'guest'}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}

    // Khởi tạo địa chỉ mặc định từ hồ sơ người dùng nếu có
    if (user?.address) {
      return [
        {
          id: 'addr-default-1',
          recipientName: user.fullName || 'Khách hàng NewMos',
          phone: user.phone || '0901234567',
          province: 'TP. Hồ Chí Minh',
          district: 'Quận 1',
          detailAddress: user.address,
          isDefault: true,
        },
      ];
    }
    return [
      {
        id: 'addr-sample-1',
        recipientName: user?.fullName || 'Khách hàng NewMos',
        phone: user?.phone || '0901234567',
        province: 'TP. Hồ Chí Minh',
        district: 'Quận 1',
        detailAddress: 'Số 123 Đường Lê Lợi, Phường Bến Thành',
        isDefault: true,
      },
    ];
  };

  const [addresses, setAddresses] = useState(getInitialAddresses);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    recipientName: '',
    phone: '',
    province: '',
    district: '',
    detailAddress: '',
    isDefault: false,
  });
  const [addressToDelete, setAddressToDelete] = useState(null);

  // =========================================================================
  // 4. STATE ĐƠN HÀNG (MY ORDERS)
  // =========================================================================
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [orderFilter, setOrderFilter] = useState('ALL');
  const [copiedCode, setCopiedCode] = useState(null);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);

  // =========================================================================
  // 5. STATE HỒ SƠ ĐO CHÂN (SIZE-FIT)
  // =========================================================================
  const [aiProfile, setAiProfile] = useState(null);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const { openChat } = useChatbotStore();
  const { addToCart } = useCartStore();

  // Toast chung
  const [toast, setToast] = useState(null);

  // Tự động đồng bộ Tab từ URL khi thay đổi
  useEffect(() => {
    setActiveTab(getResolvedTab());
  }, [getResolvedTab]);

  // Lưu addresses vào localStorage khi thay đổi
  useEffect(() => {
    if (user?.id) {
      try {
        localStorage.setItem(`newmos_addresses_${user.id}`, JSON.stringify(addresses));
      } catch (_) {}
    }
  }, [addresses, user?.id]);

  // Đồng bộ countdown đăng xuất sau khi đổi mật khẩu thành công
  useEffect(() => {
    let timer;
    if (logoutCountdown !== null && logoutCountdown > 0) {
      timer = setTimeout(() => {
        setLogoutCountdown((prev) => prev - 1);
      }, 1000);
    } else if (logoutCountdown === 0) {
      logout();
      navigate('/auth');
    }
    return () => clearTimeout(timer);
  }, [logoutCountdown, logout, navigate]);

  // =========================================================================
  // FETCH DỮ LIỆU BAN ĐẦU TỪ BACKEND
  // =========================================================================

  // 1. Fetch Profile
  const fetchUserProfile = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingProfile(true);
    try {
      const res = await userService.getProfile();
      const data = res?.data || res;
      if (data) {
        setProfileData({
          fullName: data.fullName || '',
          email: data.email || '',
          phone: data.phone || '',
          gender: data.gender || 'MALE',
          dateOfBirth: data.dateOfBirth || '',
          address: data.address || '',
          avatarUrl: data.avatarUrl || '',
          createdAt: data.createdAt || '',
        });
        if (data.avatarUrl) {
          setAvatarPreview(data.avatarUrl);
        }
        updateUser({
          fullName: data.fullName,
          phone: data.phone,
          address: data.address,
          avatarUrl: data.avatarUrl,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth,
        });
      }
    } catch (err) {
      console.error('Không thể tải thông tin tài khoản:', err);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [isAuthenticated, updateUser]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // 2. Fetch Lịch Sử Đơn Hàng
  const fetchMyOrders = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingOrders(true);
    try {
      const res = await orderService.getMyOrders();
      const data =
        res?.data?.content ||
        (Array.isArray(res?.data) ? res.data : []) ||
        (Array.isArray(res) ? res : []) ||
        [];
      setOrders(data);
    } catch (err) {
      console.error('Không thể tải lịch sử đơn hàng:', err);
      setOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchMyOrders();
  }, [fetchMyOrders]);

  // 3. Fetch Hồ sơ Đo Chân (Size-Fit)
  useEffect(() => {
    if (isAuthenticated) {
      aiService
        .getMyProfile()
        .then((res) => {
          const profile = res?.data;
          if (profile && profile.footLengthCm && Number(profile.footLengthCm) > 0) {
            setAiProfile(profile);
            useAIStore.getState().setUserProfile(profile);
          } else {
            const localProfile = useAIStore.getState().userProfile;
            const localLength = useAIStore.getState().footLength;
            if (localProfile && localProfile.footLengthCm && Number(localProfile.footLengthCm) > 0) {
              setAiProfile(localProfile);
            } else if (localLength && Number(localLength) > 0) {
              setAiProfile({
                footLengthCm: localLength,
                footWidthCm: useAIStore.getState().footWidth,
                footShape: useAIStore.getState().footShape || 'STANDARD',
                recommendedSizeEu: useAIStore.getState().recommendedSize,
              });
            } else {
              setAiProfile(null);
            }
          }
        })
        .catch(() => {
          setAiProfile(null);
        });
    } else {
      setAiProfile(null);
    }
  }, [isAuthenticated]);

  // =========================================================================
  // XỬ LÝ SỰ KIỆN TAB 1: PROFILE DETAILS
  // =========================================================================
  const handleAvatarFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToast({
        title: 'LỖI ĐỊNH DẠNG',
        message: 'Vui lòng chọn tập tin hình ảnh hợp lệ (JPG, PNG, WEBP).',
        isError: true,
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToast({
        title: 'DUNG LƯỢNG QUÁ LỚN',
        message: 'Kích thước ảnh tối đa là 5MB. Vui lòng chọn ảnh nhỏ hơn.',
        isError: true,
      });
      return;
    }

    setAvatarFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    // Đọc base64 để lưu vào profileData ngay làm phương án dự phòng chắc chắn
    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result;
      if (b64) {
        setProfileData((prev) => ({ ...prev, avatarUrl: b64 }));
      }
    };
    reader.readAsDataURL(file);

    setToast({
      title: 'ĐÃ CHỌN ẢNH ĐẠI DIỆN',
      message: 'Ảnh đã được nạp xem trước. Nhấn "Lưu Thay Đổi" để cập nhật lên hệ thống.',
      isError: false,
    });
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    setProfileData((prev) => ({ ...prev, avatarUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileData.fullName.trim()) {
      setProfileErrorMsg('Vui lòng nhập họ và tên của bạn');
      return;
    }

    // Kiểm tra định dạng số điện thoại nếu có nhập
    if (profileData.phone.trim()) {
      const phoneRegex = /^[0-9+]{9,13}$/;
      if (!phoneRegex.test(profileData.phone.trim().replace(/\s/g, ''))) {
        setProfileErrorMsg('Số điện thoại không đúng định dạng (9 - 12 chữ số).');
        return;
      }
    }

    setIsSavingProfile(true);
    setProfileSuccessMsg('');
    setProfileErrorMsg('');

    try {
      let finalAvatarUrl = profileData.avatarUrl;

      // 1. Nếu có tệp ảnh mới được chọn, upload trước qua multipart endpoint
      if (avatarFile) {
        try {
          const uploadRes = await userService.uploadAvatar(avatarFile);
          const newUrl = uploadRes?.data?.avatarUrl || uploadRes?.avatarUrl;
          if (newUrl) {
            finalAvatarUrl = newUrl;
          }
        } catch (uploadErr) {
          console.warn('Lỗi khi tải ảnh đại diện qua upload endpoint, fallback sang base64:', uploadErr);
        }
      }

      // 2. Cập nhật hồ sơ cá nhân
      const payload = {
        fullName: profileData.fullName.trim(),
        phone: profileData.phone.trim(),
        gender: profileData.gender,
        dateOfBirth: profileData.dateOfBirth,
        address: profileData.address.trim(),
        avatarUrl: finalAvatarUrl,
      };

      const res = await userService.updateProfile(payload);
      const updated = res?.data || res;
      const actualAvatarUrl = updated?.avatarUrl || finalAvatarUrl;

      setProfileData((prev) => ({ ...prev, avatarUrl: actualAvatarUrl }));
      setAvatarPreview(actualAvatarUrl);
      setAvatarFile(null);

      // Cập nhật Zustand store để Header/Navbar hiển thị avatar & tên mới ngay tức thì
      updateUser({
        fullName: updated?.fullName || payload.fullName,
        phone: updated?.phone || payload.phone,
        address: updated?.address || payload.address,
        avatarUrl: actualAvatarUrl,
        gender: updated?.gender || payload.gender,
        dateOfBirth: updated?.dateOfBirth || payload.dateOfBirth,
      });

      setProfileSuccessMsg('✓ Đã lưu thông tin tài khoản thành công!');
      setToast({
        title: 'CẬP NHẬT THÀNH CÔNG',
        message: 'Thông tin cá nhân và ảnh đại diện đã được đồng bộ toàn hệ thống.',
        isError: false,
      });
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Lỗi khi cập nhật profile:', err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại!';
      setProfileErrorMsg(msg);
      setToast({
        title: 'CẬP NHẬT THẤT BÀI',
        message: msg,
        isError: true,
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // =========================================================================
  // XỬ LÝ SỰ KIỆN TAB 2: CHANGE PASSWORD
  // =========================================================================
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordErrorMsg('');
    setPasswordSuccessMsg('');

    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword) {
      setPasswordErrorMsg('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordErrorMsg('Mật khẩu mới phải có tối thiểu 8 ký tự.');
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordErrorMsg('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('Mật khẩu xác nhận không trùng khớp 100%.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await userService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      // Reset form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setPasswordSuccessMsg('✓ Đổi mật khẩu thành công! Hệ thống sẽ yêu cầu bạn đăng nhập lại.');
      setLogoutCountdown(3);

      setToast({
        title: 'ĐỔI MẬT KHẨU THÀNH CÔNG',
        message: 'Mật khẩu mới đã được cập nhật. Bạn sẽ được chuyển tới trang đăng nhập sau 3 giây.',
        isError: false,
      });
    } catch (err) {
      console.error('Lỗi khi đổi mật khẩu:', err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại!';
      setPasswordErrorMsg(msg);
      setToast({
        title: 'ĐỔI MẬT KHẨU THẤT BÀI',
        message: msg,
        isError: true,
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // =========================================================================
  // XỬ LÝ SỰ KIỆN TAB 3: ADDRESS BOOK
  // =========================================================================
  const handleOpenAddAddressModal = () => {
    setEditingAddress(null);
    setAddressForm({
      recipientName: profileData.fullName || user?.fullName || '',
      phone: profileData.phone || user?.phone || '',
      province: 'TP. Hồ Chí Minh',
      district: '',
      detailAddress: '',
      isDefault: addresses.length === 0,
    });
    setIsAddressModalOpen(true);
  };

  const handleOpenEditAddressModal = (addr) => {
    setEditingAddress(addr);
    setAddressForm({
      recipientName: addr.recipientName,
      phone: addr.phone,
      province: addr.province,
      district: addr.district,
      detailAddress: addr.detailAddress,
      isDefault: addr.isDefault,
    });
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!addressForm.recipientName.trim() || !addressForm.phone.trim() || !addressForm.detailAddress.trim()) {
      setToast({
        title: 'THIẾU THÔNG TIN',
        message: 'Vui lòng điền đầy đủ Tên người nhận, SĐT và Địa chỉ chi tiết.',
        isError: true,
      });
      return;
    }

    let updatedList = [];
    if (editingAddress) {
      updatedList = addresses.map((item) => {
        if (item.id === editingAddress.id) {
          return {
            ...item,
            ...addressForm,
          };
        }
        return addressForm.isDefault ? { ...item, isDefault: false } : item;
      });
    } else {
      const newAddr = {
        id: `addr-${Date.now()}`,
        ...addressForm,
      };
      if (addressForm.isDefault) {
        updatedList = addresses.map((a) => ({ ...a, isDefault: false }));
        updatedList.unshift(newAddr);
      } else {
        updatedList = [...addresses, newAddr];
      }
    }

    // Nếu chỉ có 1 địa chỉ, tự động đặt làm mặc định
    if (updatedList.length === 1) {
      updatedList[0].isDefault = true;
    }

    setAddresses(updatedList);
    setIsAddressModalOpen(false);

    // Đồng bộ địa chỉ mặc định lên DB nếu được chọn
    if (addressForm.isDefault) {
      const fullAddrStr = `${addressForm.detailAddress}, ${addressForm.district ? addressForm.district + ', ' : ''}${addressForm.province}`;
      try {
        await userService.updateProfile({ address: fullAddrStr });
        updateUser({ address: fullAddrStr });
        setProfileData((prev) => ({ ...prev, address: fullAddrStr }));
      } catch (_) {}
    }

    setToast({
      title: 'ĐÃ LƯU ĐỊA CHỈ',
      message: editingAddress ? 'Đã cập nhật địa chỉ giao hàng thành công.' : 'Đã thêm địa chỉ giao hàng mới.',
      isError: false,
    });
  };

  const handleSetDefaultAddress = async (addrId) => {
    const target = addresses.find((a) => a.id === addrId);
    if (!target) return;

    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.id === addrId,
    }));
    setAddresses(updated);

    const fullAddrStr = `${target.detailAddress}, ${target.district ? target.district + ', ' : ''}${target.province}`;
    try {
      await userService.updateProfile({ address: fullAddrStr });
      updateUser({ address: fullAddrStr });
      setProfileData((prev) => ({ ...prev, address: fullAddrStr }));
    } catch (_) {}

    setToast({
      title: 'ĐỊA CHỈ MẶC ĐỊNH',
      message: `Đã đặt "${target.recipientName} - ${target.detailAddress}" làm địa chỉ giao hàng mặc định.`,
      isError: false,
    });
  };

  const handleConfirmDeleteAddress = () => {
    if (!addressToDelete) return;
    const filtered = addresses.filter((a) => a.id !== addressToDelete.id);
    if (addressToDelete.isDefault && filtered.length > 0) {
      filtered[0].isDefault = true;
    }
    setAddresses(filtered);
    setAddressToDelete(null);
    setToast({
      title: 'ĐÃ XÓA ĐỊA CHỈ',
      message: 'Địa chỉ đã được xóa khỏi danh bạ.',
      isError: false,
    });
  };

  // =========================================================================
  // XỬ LÝ SỰ KIỆN TAB 4: MY ORDERS
  // =========================================================================
  const handleCopyOrderCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleReorder = (order) => {
    if (!order.items || order.items.length === 0) {
      setToast({
        title: 'KHÔNG THỂ MUA LẠI',
        message: 'Đơn hàng này không có thông tin sản phẩm hợp lệ.',
        isError: true,
      });
      return;
    }

    let addedCount = 0;
    order.items.forEach((item) => {
      addToCart(
        {
          id: String(item.variantId || item.id || Math.random()),
          variantId: item.variantId,
          sku: item.sku,
          name: item.productName || 'Giày Sneaker NewMos',
          price: Number(item.unitPrice || item.price || 0),
          image: item.productImage || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
          color: item.color || 'Bản Tiêu Chuẩn',
          quantity: item.quantity || 1,
        },
        item.size || '42'
      );
      addedCount += item.quantity || 1;
    });

    setToast({
      title: 'ĐÃ THÊM VÀO GIỎ HÀNG',
      message: `Đã thêm ${addedCount} sản phẩm từ đơn ${order.orderCode} vào giỏ hàng. Đang chuyển tới trang thanh toán...`,
      isError: false,
    });

    setTimeout(() => {
      navigate('/checkout');
    }, 1000);
  };

  const getStatusBadge = (statusKey) => {
    const key = (statusKey || 'PENDING').toUpperCase();
    switch (key) {
      case 'PENDING':
        return {
          label: 'Chờ Xử Lý',
          dotColor: 'bg-amber-500',
          className: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'CONFIRMED':
      case 'PROCESSING':
        return {
          label: 'Đã Xác Nhận',
          dotColor: 'bg-blue-600',
          className: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'SHIPPING':
      case 'SHIPPED':
        return {
          label: 'Đang Giao Hàng',
          dotColor: 'bg-orange-500',
          className: 'bg-orange-50 text-orange-700 border-orange-200',
        };
      case 'DELIVERED':
      case 'COMPLETED':
        return {
          label: 'Giao Thành Công',
          dotColor: 'bg-emerald-600',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'CANCELLED':
        return {
          label: 'Đã Hủy',
          dotColor: 'bg-red-600',
          className: 'bg-red-50 text-red-700 border-red-200',
        };
      default:
        return {
          label: 'Đang Xử Lý',
          dotColor: 'bg-slate-500',
          className: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  const filteredOrders = orders.filter((ord) => {
    if (orderFilter === 'ALL') return true;
    const st = (ord.orderStatus || '').toUpperCase();
    if (orderFilter === 'PENDING') return st === 'PENDING';
    if (orderFilter === 'SHIPPING') return st === 'SHIPPING' || st === 'SHIPPED' || st === 'CONFIRMED' || st === 'PROCESSING';
    if (orderFilter === 'DELIVERED') return st === 'DELIVERED' || st === 'COMPLETED';
    if (orderFilter === 'CANCELLED') return st === 'CANCELLED';
    return true;
  });

  const getUserInitials = () => {
    if (profileData.fullName) {
      const parts = profileData.fullName.trim().split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return profileData.fullName.substring(0, 2).toUpperCase();
    }
    return user?.email ? user.email.substring(0, 2).toUpperCase() : 'NM';
  };

  // Danh sách các tab menu phân quyền
  const navTabs = [
    {
      id: 'profile',
      label: 'Thông Tin Cá Nhân',
      icon: User,
      desc: 'Quản lý thông tin & ảnh đại diện',
    },
    {
      id: 'security',
      label: 'Đổi Mật Khẩu',
      icon: Lock,
      desc: 'Bảo mật tài khoản & mật khẩu',
    },
    {
      id: 'addresses',
      label: 'Địa Chỉ Giao Hàng',
      icon: MapPin,
      desc: 'Sổ địa chỉ nhận giày siêu tốc',
    },
    {
      id: 'orders',
      label: 'Lịch Sử Đơn Hàng',
      icon: Package,
      count: orders.length,
      desc: 'Theo dõi tiến độ đơn hàng NewMos',
    },
    {
      id: 'size-fit',
      label: 'Hồ Sơ Đo Chân (Size-Fit)',
      icon: Footprints,
      desc: 'Dữ liệu số đo chân & dáng bàn chân',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 sm:py-12 text-slate-900 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* =========================================================================
            TOAST NOTIFICATION MODAL
           ========================================================================= */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-2xl shadow-2xl border flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-200 ${
              toast.isError
                ? 'bg-red-950 text-white border-red-700'
                : 'bg-[#0A0A0A] text-white border-neutral-700'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                toast.isError ? 'bg-red-600 text-white' : 'bg-emerald-500 text-white'
              }`}
            >
              {toast.isError ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            </div>
            <div className="flex-1">
              <h5 className="font-bold text-xs uppercase tracking-wider font-mono">
                {toast.title}
              </h5>
              <p className="text-xs text-neutral-300 mt-0.5 leading-relaxed font-sans">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* =========================================================================
            BỐ CỤC CHÍNH: 2 CỘT (SIDEBAR SETTINGS + MAIN CONTENT PANEL)
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* =======================================================================
              CỘT TRÁI (COL-SPAN-4): SIDEBAR USER PROFILE & NAVIGATION TABS
             ======================================================================= */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 1. USER PROFILE SUMMARY CARD */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm relative overflow-hidden">
              {/* Nền gradient trang trí */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-red-600/5 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10" />
              <div className="absolute bottom-0 left-0 w-36 h-36 bg-slate-900/5 rounded-full blur-2xl pointer-events-none -ml-10 -mb-10" />

              <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                
                {/* Avatar with Camera upload button */}
                <div className="relative group">
                  <div className="w-24 h-24 rounded-3xl bg-[#0A0A0A] text-white flex items-center justify-center font-display font-black text-3xl border-2 border-[#DC3E37] shadow-xl shadow-red-600/20 overflow-hidden relative">
                    <span className="select-none">{getUserInitials()}</span>
                    {avatarPreview && (
                      <img
                        src={avatarPreview}
                        alt={profileData.fullName || 'User Avatar'}
                        className="w-full h-full object-cover absolute inset-0 bg-[#0A0A0A]"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                  </div>

                  {/* Nút Đổi ảnh Avatar */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Tải lên ảnh đại diện mới"
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#DC3E37] hover:bg-red-700 text-white border-2 border-white flex items-center justify-center shadow-md transition-all cursor-pointer group-hover:scale-110"
                  >
                    <Camera className="w-4 h-4" />
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleAvatarFileSelect}
                    className="hidden"
                  />
                </div>

                {/* User Name & Badges */}
                <div className="space-y-1 w-full">
                  <h2 className="text-lg font-black text-[#0A0A0A] font-display uppercase tracking-tight truncate">
                    {profileData.fullName || user?.fullName || 'Khách Hàng NewMos'}
                  </h2>
                  <p className="text-xs text-slate-500 truncate font-mono">
                    {profileData.email || user?.email}
                  </p>

                  {/* PHÂN QUYỀN: HUY HIỆU ADMIN BADGE HOẶC VIP MEMBER */}
                  <div className="pt-2 flex items-center justify-center gap-2">
                    {isAdmin ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white text-[10px] font-mono font-black uppercase tracking-wider shadow-md shadow-red-600/30">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>ADMINISTRATOR BADGE</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-mono font-bold uppercase">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>HỘI VIÊN KINETIC MEMBER</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* NÚT CHUYỂN HƯỚNG NHANH CHO ADMIN SANG TRANG QUẢN TRỊ */}
                {isAdmin && (
                  <div className="w-full pt-2">
                    <Link
                      to="/admin"
                      className="w-full py-3 px-4 rounded-2xl bg-[#0A0A0A] hover:bg-neutral-800 text-white border border-red-500/40 text-xs font-black uppercase tracking-wider flex items-center justify-between transition-all shadow-md group hover:border-red-500"
                    >
                      <span className="flex items-center gap-2.5">
                        <LayoutDashboard className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                        <span>Trang Quản Trị Hệ Thống</span>
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white" />
                    </Link>
                  </div>
                )}

                {/* Quick Stats: Tổng đơn & Đang giao */}
                <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">ĐƠN HÀNG</span>
                    <span className="text-base font-black font-mono text-[#0A0A0A]">{orders.length}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-red-50/70 border border-red-100 text-center">
                    <span className="text-[10px] font-mono uppercase text-red-600 font-bold block">ĐANG GIAO</span>
                    <span className="text-base font-black font-mono text-red-600">
                      {orders.filter((o) => ['PENDING', 'CONFIRMED', 'SHIPPING', 'PROCESSING'].includes(o.orderStatus)).length}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* 2. SIDEBAR NAVIGATION MENU (5 TABS) */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-3 sm:p-4 shadow-sm space-y-1">
              <span className="px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                DANH MỤC CÀI ĐẶT
              </span>

              {navTabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      navigate(`/profile?tab=${tab.id}`, { replace: true });
                    }}
                    className={`w-full p-3 rounded-2xl text-left flex items-center justify-between transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#0A0A0A] text-white shadow-md shadow-black/10'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-[#DC3E37] text-white'
                            : 'bg-slate-100 text-slate-600 group-hover:text-slate-900'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold block truncate uppercase tracking-tight">
                          {tab.label}
                        </span>
                        <span
                          className={`text-[10px] truncate block ${
                            isActive ? 'text-neutral-400' : 'text-slate-400'
                          }`}
                        >
                          {tab.desc}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {tab.count !== undefined && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            isActive ? 'bg-[#DC3E37] text-white' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                      <ChevronRight
                        className={`w-4 h-4 ${isActive ? 'text-red-500' : 'text-slate-300'}`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

          </div>

          {/* =======================================================================
              CỘT PHẢI (COL-SPAN-8): MAIN CONTENT PANEL THEO TỪNG TAB
             ======================================================================= */}
          <div className="lg:col-span-8 space-y-6">

            {/* =====================================================================
                TAB A: CHỈNH SỬA THÔNG TIN CÁ NHÂN (PROFILE DETAILS)
               ===================================================================== */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-100 pb-4 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-[#0A0A0A] font-display flex items-center gap-2">
                      <User className="w-5 h-5 text-[#DC3E37]" />
                      <span>Thông Tin Tài Khoản & Cá Nhân</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-sans mt-0.5">
                      Cập nhật họ tên, ảnh đại diện, số điện thoại và ngày sinh để hưởng quyền lợi thành viên NewMos.
                    </p>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-mono font-bold">
                    CẬP NHẬT GẦN NHẤT: {new Date().toLocaleDateString('vi-VN')}
                  </span>
                </div>

                {/* Thông báo thành công / lỗi */}
                {profileSuccessMsg && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{profileSuccessMsg}</span>
                  </div>
                )}

                {profileErrorMsg && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                    <span>{profileErrorMsg}</span>
                  </div>
                )}

                {isLoadingProfile ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-mono animate-pulse">
                    Đang tải thông tin tài khoản...
                  </div>
                ) : (
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    
                    {/* Phần 1: Tải lên & Xem trước Avatar */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-[#0A0A0A] text-white flex items-center justify-center font-display font-black text-xl border-2 border-[#DC3E37] overflow-hidden shrink-0 relative">
                          <span className="select-none">{getUserInitials()}</span>
                          {avatarPreview && (
                            <img
                              src={avatarPreview}
                              alt="Avatar Preview"
                              className="w-full h-full object-cover absolute inset-0 bg-[#0A0A0A]"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase font-mono">
                            Ảnh Đại Diện Tài Khoản
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Hỗ trợ định dạng JPG, PNG, WEBP (tối đa 5MB). Xem trước ngay tức thì.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold uppercase font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        >
                          <Camera className="w-3.5 h-3.5 text-[#DC3E37]" />
                          <span>Tải ảnh mới</span>
                        </button>
                        {avatarPreview && (
                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-all cursor-pointer"
                            title="Xóa ảnh đại diện"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Phần 2: Các trường nhập thông tin */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      
                      {/* Họ và tên */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="block text-slate-700 font-bold uppercase font-mono text-[11px]">
                          Họ và tên <span className="text-[#DC3E37]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={profileData.fullName}
                          onChange={(e) =>
                            setProfileData({ ...profileData, fullName: e.target.value })
                          }
                          placeholder="Ví dụ: Nguyễn Văn An"
                          className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-[#DC3E37] focus:ring-1 focus:ring-[#DC3E37] transition-all font-sans"
                        />
                      </div>

                      {/* Email (Readonly + Badge Đã xác thực) */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-slate-700 font-bold uppercase font-mono text-[11px]">
                            Địa chỉ Email
                          </label>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[10px] font-mono font-bold text-emerald-700">
                            <CheckCheck className="w-3 h-3 text-emerald-600" />
                            <span>ĐÃ XÁC THỰC</span>
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type="email"
                            disabled
                            value={profileData.email}
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-100 text-slate-500 text-sm cursor-not-allowed font-mono"
                          />
                          <span className="absolute right-3.5 top-3.5 text-[10px] font-bold text-slate-400 font-mono">
                            CỐ ĐỊNH
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Email dùng để nhận hóa đơn điện tử và mã xác thực đơn hàng, không thể sửa đổi trực tiếp.
                        </p>
                      </div>

                      {/* Số điện thoại */}
                      <div className="space-y-1.5">
                        <label className="block text-slate-700 font-bold uppercase font-mono text-[11px]">
                          Số điện thoại liên hệ
                        </label>
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) =>
                            setProfileData({ ...profileData, phone: e.target.value })
                          }
                          placeholder="Ví dụ: 0912345678"
                          className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-slate-900 text-sm font-mono focus:outline-none focus:border-[#DC3E37] focus:ring-1 focus:ring-[#DC3E37] transition-all"
                        />
                      </div>

                      {/* Ngày sinh */}
                      <div className="space-y-1.5">
                        <label className="block text-slate-700 font-bold uppercase font-mono text-[11px]">
                          Ngày sinh
                        </label>
                        <input
                          type="date"
                          value={profileData.dateOfBirth}
                          onChange={(e) =>
                            setProfileData({ ...profileData, dateOfBirth: e.target.value })
                          }
                          className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-slate-900 text-sm font-mono focus:outline-none focus:border-[#DC3E37] focus:ring-1 focus:ring-[#DC3E37] transition-all"
                        />
                      </div>

                      {/* Giới tính */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="block text-slate-700 font-bold uppercase font-mono text-[11px]">
                          Giới tính
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { id: 'MALE', label: 'Nam' },
                            { id: 'FEMALE', label: 'Nữ' },
                            { id: 'OTHER', label: 'Khác' },
                          ].map((g) => (
                            <button
                              type="button"
                              key={g.id}
                              onClick={() => setProfileData({ ...profileData, gender: g.id })}
                              className={`py-2.5 px-4 rounded-xl text-xs font-bold uppercase font-mono border transition-all cursor-pointer ${
                                profileData.gender === g.id
                                  ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-sm'
                                  : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                              }`}
                            >
                              {g.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Địa chỉ mặc định */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="block text-slate-700 font-bold uppercase font-mono text-[11px]">
                          Địa chỉ giao hàng mặc định
                        </label>
                        <textarea
                          rows={2}
                          value={profileData.address}
                          onChange={(e) =>
                            setProfileData({ ...profileData, address: e.target.value })
                          }
                          placeholder="Ví dụ: Số 123 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh"
                          className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-[#DC3E37] focus:ring-1 focus:ring-[#DC3E37] transition-all font-sans leading-relaxed"
                        />
                      </div>

                    </div>

                    {/* Nút Cập nhật thông tin (CTA Đỏ #DC3E37) */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#DC3E37] hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
                      >
                        {isSavingProfile ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Đang Lưu Thay Đổi...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Lưu Thay Đổi</span>
                          </>
                        )}
                      </button>
                    </div>

                  </form>
                )}
              </div>
            )}

            {/* =====================================================================
                TAB B: ĐỔI MẬT KHẨU (SECURITY / CHANGE PASSWORD)
               ===================================================================== */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-[#0A0A0A] font-display flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-[#DC3E37]" />
                    <span>Bảo Mật & Đổi Mật Khẩu</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-sans mt-0.5">
                    Để bảo vệ an toàn cho tài khoản và đơn hàng, bạn nên sử dụng mật khẩu mạnh tối thiểu 8 ký tự.
                  </p>
                </div>

                {/* Thông báo thành công / lỗi */}
                {passwordSuccessMsg && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold space-y-1 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{passwordSuccessMsg}</span>
                    </div>
                    {logoutCountdown !== null && (
                      <p className="text-[11px] text-emerald-700 font-mono pl-6">
                        Tự động chuyển tới trang đăng nhập sau {logoutCountdown} giây...
                      </p>
                    )}
                  </div>
                )}

                {passwordErrorMsg && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                    <span>{passwordErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-5 max-w-xl">
                  
                  {/* 1. Mật khẩu hiện tại */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-700 font-bold uppercase font-mono text-[11px]">
                      Mật khẩu hiện tại <span className="text-[#DC3E37]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        required
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                        }
                        placeholder="Nhập mật khẩu đang sử dụng"
                        className="w-full px-4 py-3 pr-12 rounded-2xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-[#DC3E37] focus:ring-1 focus:ring-[#DC3E37] transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title={showCurrentPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* 2. Mật khẩu mới */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-700 font-bold uppercase font-mono text-[11px]">
                      Mật khẩu mới <span className="text-[#DC3E37]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                        }
                        placeholder="Tối thiểu 8 ký tự bảo mật"
                        className="w-full px-4 py-3 pr-12 rounded-2xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-[#DC3E37] focus:ring-1 focus:ring-[#DC3E37] transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* 3. Xác nhận mật khẩu mới */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-700 font-bold uppercase font-mono text-[11px]">
                      Xác nhận mật khẩu mới <span className="text-[#DC3E37]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                        }
                        placeholder="Nhập lại chính xác mật khẩu mới"
                        className="w-full px-4 py-3 pr-12 rounded-2xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-[#DC3E37] focus:ring-1 focus:ring-[#DC3E37] transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Checklist kiểm tra tính hợp lệ của mật khẩu */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-[11px] font-mono">
                    <span className="text-slate-500 font-bold block uppercase text-[10px]">
                      TIÊU CHUẨN MẬT KHẨU AN TOÀN:
                    </span>
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                        passwordForm.newPassword.length >= 8 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        ✓
                      </span>
                      <span>Tối thiểu 8 ký tự ({passwordForm.newPassword.length}/8)</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                        passwordForm.newPassword && passwordForm.newPassword !== passwordForm.currentPassword
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        ✓
                      </span>
                      <span>Không trùng với mật khẩu hiện tại</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                        passwordForm.confirmPassword && passwordForm.confirmPassword === passwordForm.newPassword
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        ✓
                      </span>
                      <span>Mật khẩu xác nhận trùng khớp 100%</span>
                    </div>
                  </div>

                  {/* Nút Submit đổi mật khẩu */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="px-8 py-3.5 rounded-2xl bg-[#DC3E37] hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
                    >
                      {isChangingPassword ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Đang Xác Thực...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Cập Nhật Mật Khẩu Mới</span>
                        </>
                      )}
                    </button>
                  </div>

                </form>
              </div>
            )}

            {/* =====================================================================
                TAB C: SỔ ĐỊA CHỈ (ADDRESS BOOK)
               ===================================================================== */}
            {activeTab === 'addresses' && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-[#0A0A0A] font-display flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-[#DC3E37]" />
                      <span>Sổ Địa Chỉ Giao Hàng</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-sans mt-0.5">
                      Lưu sẵn nhiều địa chỉ nhận hàng để thanh toán nhanh chóng chỉ với 1 cú click.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddAddressModal}
                    className="px-4 py-2.5 rounded-xl bg-[#DC3E37] hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-auto transition-all cursor-pointer shadow-md shadow-red-600/20 active:scale-98"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm Địa Chỉ Mới</span>
                  </button>
                </div>

                {/* Danh Sách Địa Chỉ */}
                {addresses.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <MapPin className="w-8 h-8" />
                    </div>
                    <p className="text-xs text-slate-500 font-sans">
                      Bạn chưa lưu địa chỉ nhận hàng nào. Hãy thêm địa chỉ đầu tiên để bắt đầu đặt hàng!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-5 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
                          addr.isDefault
                            ? 'bg-red-50/20 border-[#DC3E37] shadow-sm ring-1 ring-[#DC3E37]/30'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm text-[#0A0A0A] font-sans">
                              {addr.recipientName}
                            </span>
                            {addr.isDefault && (
                              <span className="px-2 py-0.5 rounded-full bg-[#DC3E37] text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                                MẶC ĐỊNH
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-600 font-mono flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{addr.phone}</span>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed font-sans">
                            {addr.detailAddress}
                            {addr.district ? `, ${addr.district}` : ''}
                            {addr.province ? `, ${addr.province}` : ''}
                          </p>
                        </div>

                        {/* Các hành động với thẻ địa chỉ */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                          {!addr.isDefault ? (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="text-xs font-bold text-slate-600 hover:text-[#DC3E37] font-mono transition-colors cursor-pointer"
                            >
                              Đặt làm mặc định
                            </button>
                          ) : (
                            <span className="text-[11px] font-mono text-emerald-600 font-bold flex items-center gap-1">
                              ✓ Địa chỉ chính
                            </span>
                          )}

                          <div className="flex items-center gap-1.5 ml-auto">
                            <button
                              type="button"
                              onClick={() => handleOpenEditAddressModal(addr)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Sửa địa chỉ"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setAddressToDelete(addr)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Xóa địa chỉ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* =====================================================================
                TAB D: LỊCH SỬ ĐƠN HÀNG (MY ORDERS)
               ===================================================================== */}
            {activeTab === 'orders' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Bộ Lọc Trạng Thái Đơn Hàng (Status Filters) */}
                <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 flex items-center justify-between gap-3 flex-wrap shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                    <Filter className="w-3.5 h-3.5 text-[#DC3E37]" />
                    <span>Lọc đơn:</span>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    {[
                      { id: 'ALL', label: 'Tất Cả' },
                      { id: 'PENDING', label: 'Chờ Xử Lý' },
                      { id: 'SHIPPING', label: 'Đang Giao' },
                      { id: 'DELIVERED', label: 'Đã Giao' },
                      { id: 'CANCELLED', label: 'Đã Hủy' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setOrderFilter(f.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                          orderFilter === f.id
                            ? 'bg-[#DC3E37] text-white shadow-sm shadow-red-600/30'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Danh Sách Đơn Hàng */}
                {isLoadingOrders ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 animate-pulse"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                          <div className="h-5 w-40 bg-slate-200 rounded-md" />
                          <div className="h-6 w-28 bg-slate-200 rounded-full" />
                        </div>
                        <div className="flex items-center gap-4 py-2">
                          <div className="w-16 h-16 bg-slate-200 rounded-xl shrink-0" />
                          <div className="space-y-2 flex-1">
                            <div className="h-4 w-1/2 bg-slate-200 rounded-md" />
                            <div className="h-3 w-1/4 bg-slate-200 rounded-md" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <div className="h-5 w-32 bg-slate-200 rounded-md" />
                          <div className="h-9 w-48 bg-slate-200 rounded-xl" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center space-y-4 shadow-sm">
                    <div className="w-20 h-20 rounded-full bg-red-50 text-[#DC3E37] flex items-center justify-center mx-auto border-2 border-red-200">
                      <ShoppingBag className="w-10 h-10 stroke-[1.8]" />
                    </div>
                    <div className="space-y-1.5 max-w-md mx-auto">
                      <h3 className="text-base sm:text-lg font-black text-[#0A0A0A] uppercase tracking-tight font-display">
                        Bạn Chưa Có Đơn Hàng Nào
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed font-sans">
                        {orderFilter === 'ALL'
                          ? 'Khám phá ngay bộ sưu tập giày Sneaker công nghệ AI NewMos và tận hưởng trải nghiệm mua sắm đỉnh cao với chuẩn size vừa vặn.'
                          : `Không tìm thấy đơn hàng nào ở trạng thái "${orderFilter}". Hãy thử chọn bộ lọc khác.`}
                      </p>
                    </div>
                    <div className="pt-2">
                      <Link
                        to="/shop"
                        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#DC3E37] hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all cursor-pointer active:scale-98"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Khám Phá Bộ Sưu Tập Ngay</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {filteredOrders.map((order) => {
                      const statusInfo = getStatusBadge(order.orderStatus);
                      const items = order.items || [];
                      const orderDate = order.createdAt
                        ? new Date(order.createdAt).toLocaleString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Vừa xong';

                      return (
                        <div
                          key={order.id}
                          className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:border-slate-300 transition-all overflow-hidden"
                        >
                          {/* 1. HEADER CARD: Mã đơn, ngày đặt, badge */}
                          <div className="p-4 sm:p-5 bg-slate-50/80 border-b border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono uppercase font-bold text-slate-500">Mã đơn:</span>
                                <span className="font-mono font-black text-sm text-[#0A0A0A] tracking-wider select-all">
                                  {order.orderCode || `NM-${order.id}`}
                                </span>
                                <button
                                  onClick={() => handleCopyOrderCode(order.orderCode || `NM-${order.id}`)}
                                  className="p-1 rounded-md text-slate-400 hover:text-[#DC3E37] hover:bg-white transition-all cursor-pointer"
                                  title="Sao chép mã đơn"
                                >
                                  {copiedCode === (order.orderCode || `NM-${order.id}`) ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>

                              <span className="text-slate-300 hidden sm:inline">•</span>

                              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>{orderDate}</span>
                              </div>
                            </div>

                            {/* Badge trạng thái */}
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase font-mono tracking-wider border ${statusInfo.className}`}
                              >
                                <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`} />
                                <span>{statusInfo.label}</span>
                              </span>
                            </div>
                          </div>

                          {/* 2. BODY CARD: Danh sách sản phẩm tóm tắt */}
                          <div className="p-4 sm:p-6 divide-y divide-slate-100">
                            {items.length > 0 ? (
                              items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                                >
                                  <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                                    <img
                                      src={
                                        item.productImage ||
                                        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=200&q=80'
                                      }
                                      alt={item.productName}
                                      className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover bg-slate-50 border border-slate-200 shrink-0"
                                    />
                                    <div className="min-w-0">
                                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                        {item.productName}
                                      </h4>
                                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-1 flex-wrap">
                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-700">
                                          Size {item.size} EU
                                        </span>
                                        {item.color && (
                                          <span className="text-slate-600 font-medium">
                                            • {item.color}
                                          </span>
                                        )}
                                        <span>
                                          • SL: <strong className="text-slate-800">x{item.quantity}</strong>
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <div className="text-xs sm:text-sm font-mono font-black text-slate-900">
                                      {formatCurrency(Number(item.totalPrice || item.unitPrice * item.quantity))}
                                    </div>
                                    <span className="text-[10px] text-slate-400 block font-mono">
                                      {formatCurrency(Number(item.unitPrice || item.price))}/đôi
                                    </span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="py-2 text-xs text-slate-500 font-mono">
                                Chi tiết sản phẩm giày NewMos chính hãng
                              </div>
                            )}
                          </div>

                          {/* 3. FOOTER CARD: Tổng tiền thanh toán & Nút Xem chi tiết, Mua lại */}
                          <div className="p-4 sm:p-5 bg-slate-50/50 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                                Tổng tiền thanh toán
                              </span>
                              <div className="text-lg sm:text-xl font-mono font-black text-[#DC3E37]">
                                {formatCurrency(Number(order.totalAmount || 0))}
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                              {/* Nút Xem chi tiết đơn hàng */}
                              <button
                                type="button"
                                onClick={() => setSelectedOrderForDetail(order)}
                                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-300 hover:border-slate-900 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-98"
                              >
                                <Package className="w-3.5 h-3.5 text-[#DC3E37]" />
                                <span>Xem Chi Tiết</span>
                              </button>

                              {/* Nút Theo dõi đơn */}
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/order-tracking?orderId=${encodeURIComponent(
                                      order.orderCode || order.id
                                    )}`
                                  )
                                }
                                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-300 hover:border-slate-900 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-98"
                              >
                                <Truck className="w-3.5 h-3.5 text-slate-600" />
                                <span>Theo Dõi</span>
                              </button>

                              {/* Nút Mua lại */}
                              <button
                                type="button"
                                onClick={() => handleReorder(order)}
                                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#DC3E37] hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-red-600/25 active:scale-98"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-white" />
                                <span>Mua Lại</span>
                              </button>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            )}

            {/* =====================================================================
                TAB E: HỒ SƠ ĐO CHÂN (SIZE-FIT)
               ===================================================================== */}
            {activeTab === 'size-fit' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {Boolean(aiProfile && aiProfile.footLengthCm && Number(aiProfile.footLengthCm) > 0) ? (
                  /* ================= ĐÃ CÓ DỮ LIỆU SỐ ĐO THẬT ================= */
                  <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-base font-black uppercase text-[#0A0A0A] font-display flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-[#DC3E37]" />
                          <span>Dữ Liệu Số Đo Bàn Chân NewMos Fit</span>
                        </h3>
                        <p className="text-xs text-slate-500 font-sans mt-0.5">
                          Hệ thống NewMos tự động đối chiếu thông số chiều dài và dáng chân của bạn với từng form giày thể thao.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsSizeGuideOpen(true)}
                        className="px-4 py-2 rounded-xl bg-[#0A0A0A] hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 self-start sm:self-auto transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-red-500" />
                        <span>Đo Lại / Cập Nhật Size</span>
                      </button>
                    </div>

                    {/* 4 Card Thông số đo */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                        <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                          CHIỀU DÀI BÀN CHÂN
                        </span>
                        <div className="text-xl font-mono font-black text-slate-900 mt-1">
                          {Math.round(aiProfile.footLengthCm * 10)} MM
                        </div>
                        <span className="text-[10px] text-slate-500">
                          Chuẩn {aiProfile.footLengthCm} cm
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                        <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                          ĐỘ RỘNG BÀN CHÂN
                        </span>
                        <div className="text-xl font-mono font-black text-slate-900 mt-1">
                          {aiProfile.footWidthCm ? `${Math.round(aiProfile.footWidthCm * 10)} MM` : 'Tiêu chuẩn'}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {aiProfile.footShape === 'WIDE'
                            ? 'Bè ngang (Wide)'
                            : aiProfile.footShape === 'SLIM'
                            ? 'Thon gọn (Slim)'
                            : 'Tiêu chuẩn (Standard)'}
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                        <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                          VÒM CHÂN (ARCH)
                        </span>
                        <div className="text-xl font-mono font-black text-[#DC3E37] mt-1">
                          {aiProfile.archType === 'LOW_FLAT'
                            ? 'VÒM BẸT'
                            : aiProfile.archType === 'HIGH'
                            ? 'VÒM CAO'
                            : 'VÒM CHUẨN'}
                        </div>
                        <span className="text-[10px] text-slate-500">Chống lật bàn chân</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                        <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                          SIZE KHUYÊN DÙNG
                        </span>
                        <div className="text-xl font-mono font-black text-emerald-600 mt-1">
                          {aiProfile.recommendedSizeEu ? `${aiProfile.recommendedSizeEu} EU` : 'N/A'}
                        </div>
                        <span className="text-[10px] text-slate-500">Khớp form NewMos</span>
                      </div>
                    </div>

                    {/* Lời khuyên fitting */}
                    {aiProfile.fittingAdvice && (
                      <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-slate-800 space-y-1">
                        <strong className="text-red-700 block font-mono uppercase">
                          Lời khuyên chọn giày chuyên biệt:
                        </strong>
                        <p className="leading-relaxed font-sans">{aiProfile.fittingAdvice}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <Link
                        to="/shop"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#DC3E37] hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-red-600/30"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Mua Giày Chuẩn Form Ngay</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => setIsSizeGuideOpen(true)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        <Ruler className="w-4 h-4 text-[#DC3E37]" />
                        <span>Đo Lại Kích Thước Chân</span>
                      </button>
                    </div>

                  </div>
                ) : (
                  /* ================= EMPTY STATE KHI CHƯA CÓ HỒ SƠ ĐO CHÂN ================= */
                  <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-14 shadow-sm text-center animate-in fade-in duration-200">
                    <div className="max-w-lg mx-auto space-y-6">
                      <div className="w-20 h-20 mx-auto rounded-3xl bg-red-50 border border-red-200 text-[#DC3E37] flex items-center justify-center shadow-lg shadow-red-600/10">
                        <Footprints className="w-10 h-10" />
                      </div>

                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100/70 border border-red-200 text-red-700 text-[11px] font-mono font-bold uppercase">
                          <Sparkles className="w-3.5 h-3.5 text-[#DC3E37]" />
                          <span>HỒ SƠ ĐO CHÂN NEWMOS FIT</span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black uppercase text-[#0A0A0A] font-display">
                          Chưa Có Hồ Sơ Đo Chân
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 font-sans leading-relaxed">
                          Bạn chưa cập nhật số đo bàn chân. Hãy đo ngay để NewMos gợi ý size giày chuẩn xác nhất theo dáng chân của bạn.
                        </p>
                      </div>

                      {/* 3 Điểm nổi bật */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                          <span className="text-[10px] font-bold text-[#DC3E37] font-mono block">01 // ĐO NHANH</span>
                          <p className="text-[11px] text-slate-600 leading-tight">Chỉ mất 2 phút với tờ giấy A4 và thước kẻ tại nhà</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                          <span className="text-[10px] font-bold text-[#DC3E37] font-mono block">02 // CHUẨN FORM</span>
                          <p className="text-[11px] text-slate-600 leading-tight">Tự động bù trừ theo dáng chân thon gọn hoặc bè mu dày</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                          <span className="text-[10px] font-bold text-[#DC3E37] font-mono block">03 // TỰ ĐỘNG CHỌN</span>
                          <p className="text-[11px] text-slate-600 leading-tight">Tự động chọn size chuẩn xác khi duyệt chi tiết giày</p>
                        </div>
                      </div>

                      {/* Nút Call-To-Action (CTA) nổi bật */}
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsSizeGuideOpen(true)}
                          className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#DC3E37] hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <Ruler className="w-4 h-4" />
                          <span>Bắt Đầu Đo / Nhập Số Đo Chân</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openChat('Chào NewMos AI, hãy hướng dẫn mình đo và tính size chân chuẩn xác')}
                          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#0A0A0A] hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 text-red-400" />
                          <span>Kích Hoạt Trợ Lý AI Đo Chân</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

        {/* =========================================================================
            MODAL 1: THÊM / CHỈNH SỬA ĐỊA CHỈ NHẬN HÀNG
           ========================================================================= */}
        {isAddressModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-display font-black text-base uppercase text-[#0A0A0A] flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#DC3E37]" />
                  <span>{editingAddress ? 'Chỉnh Sửa Địa Chỉ' : 'Thêm Địa Chỉ Mới'}</span>
                </h3>
                <button
                  onClick={() => setIsAddressModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAddress} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 uppercase font-mono text-[10px]">
                      Tên Người Nhận <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={addressForm.recipientName}
                      onChange={(e) => setAddressForm({ ...addressForm, recipientName: e.target.value })}
                      placeholder="Nguyễn Văn A"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#DC3E37]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 uppercase font-mono text-[10px]">
                      Số Điện Thoại <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      placeholder="0912 345 678"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:border-[#DC3E37]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 uppercase font-mono text-[10px]">
                      Tỉnh / Thành Phố <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={addressForm.province}
                      onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })}
                      placeholder="TP. Hồ Chí Minh"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#DC3E37]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 uppercase font-mono text-[10px]">
                      Quận / Huyện <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={addressForm.district}
                      onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                      placeholder="Quận 1"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#DC3E37]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase font-mono text-[10px]">
                    Địa Chỉ Chi Tiết (Số nhà, tên đường, phường/xã) <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={addressForm.detailAddress}
                    onChange={(e) => setAddressForm({ ...addressForm, detailAddress: e.target.value })}
                    placeholder="Số 123 Đường Lê Lợi, Phường Bến Thành"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#DC3E37]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isDefaultAddr"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    className="w-4 h-4 text-[#DC3E37] rounded border-slate-300 focus:ring-[#DC3E37]"
                  />
                  <label htmlFor="isDefaultAddr" className="text-xs text-slate-700 font-medium cursor-pointer">
                    Đặt làm địa chỉ nhận hàng mặc định
                  </label>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase font-mono cursor-pointer"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#DC3E37] hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-red-600/30 cursor-pointer"
                  >
                    Lưu Địa Chỉ
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 2: XÁC NHẬN XÓA ĐỊA CHỈ
           ========================================================================= */}
        {addressToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 max-w-sm w-full shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-150">
              <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
                <Trash2 className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h4 className="font-display font-black text-base uppercase text-[#0A0A0A]">
                  Xóa Địa Chỉ Giao Hàng?
                </h4>
                <p className="text-xs text-slate-500 font-sans leading-relaxed">
                  Bạn có chắc chắn muốn xóa địa chỉ của <strong>{addressToDelete.recipientName}</strong>? Thao tác này không thể hoàn tác.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddressToDelete(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase font-mono cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteAddress}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-red-600/30 cursor-pointer"
                >
                  Xác Nhận Xóa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 3: XEM CHI TIẾT ĐƠN HÀNG (ORDER DETAIL MODAL)
           ========================================================================= */}
        {selectedOrderForDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 my-8 animate-in zoom-in-95 duration-150">
              
              {/* Header Modal */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-black text-base uppercase text-[#0A0A0A]">
                      Chi Tiết Đơn Hàng
                    </h3>
                    <span className="font-mono font-bold text-sm text-[#DC3E37]">
                      {selectedOrderForDetail.orderCode || `NM-${selectedOrderForDetail.id}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Ngày đặt:{' '}
                    {selectedOrderForDetail.createdAt
                      ? new Date(selectedOrderForDetail.createdAt).toLocaleString('vi-VN')
                      : 'Vừa xong'}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedOrderForDetail(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Thông tin người nhận & Địa chỉ giao hàng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                <div className="space-y-1">
                  <span className="font-mono uppercase font-bold text-[10px] text-slate-400 block">
                    THÔNG TIN NGƯỜI NHẬN
                  </span>
                  <div className="font-bold text-slate-900">
                    {selectedOrderForDetail.customerName || profileData.fullName || user?.fullName || 'Khách hàng NewMos'}
                  </div>
                  <div className="text-slate-600 font-mono">
                    {selectedOrderForDetail.customerPhone || profileData.phone || user?.phone || '0901234567'}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="font-mono uppercase font-bold text-[10px] text-slate-400 block">
                    ĐỊA CHỈ NHẬN HÀNG
                  </span>
                  <div className="text-slate-700 leading-relaxed">
                    {selectedOrderForDetail.shippingAddress || profileData.address || 'Địa chỉ tiêu chuẩn đã lưu'}
                  </div>
                </div>
              </div>

              {/* Danh Sách Sản Phẩm */}
              <div className="space-y-3">
                <span className="font-mono uppercase font-bold text-xs text-slate-400 block">
                  DANH SÁCH SẢN PHẨM TRONG ĐƠN ({selectedOrderForDetail.items?.length || 0})
                </span>

                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
                  {(selectedOrderForDetail.items || []).map((item, idx) => (
                    <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.productImage || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff'}
                          alt={item.productName}
                          className="w-14 h-14 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {item.productName}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 font-bold">
                              Size {item.size} EU
                            </span>
                            <span>• Số lượng: x{item.quantity}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 font-mono font-bold text-xs text-slate-900">
                        {formatCurrency(Number(item.totalPrice || item.unitPrice * item.quantity))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chi tiết thanh toán & Tổng tiền */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Tạm tính:</span>
                  <span className="font-mono font-bold">{formatCurrency(Number(selectedOrderForDetail.totalAmount || 0))}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Phí vận chuyển NewMos Express:</span>
                  <span className="font-mono font-bold text-emerald-600">MIỄN PHÍ</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-900 uppercase font-mono">TỔNG CỘNG THANH TOÁN:</span>
                  <span className="text-lg font-mono font-black text-[#DC3E37]">
                    {formatCurrency(Number(selectedOrderForDetail.totalAmount || 0))}
                  </span>
                </div>
              </div>

              {/* Footer Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForDetail(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase font-mono cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleReorder(selectedOrderForDetail);
                    setSelectedOrderForDetail(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#DC3E37] hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-red-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Mua Lại Đơn Này</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Modal hướng dẫn & nhập số đo chân */}
        <SizeGuideModal
          isOpen={isSizeGuideOpen}
          onClose={() => setIsSizeGuideOpen(false)}
          initialProfile={aiProfile}
          onProfileSaved={(saved) => {
            setAiProfile(saved);
            useAIStore.getState().setUserProfile(saved);
            setToast({
              title: 'CẬP NHẬT THÀNH CÔNG',
              message: '✓ Cập nhật hồ sơ đo chân NewMos Fit thành công!',
              isError: false,
            });
            setTimeout(() => setToast(null), 3500);
          }}
        />

      </div>
    </div>
  );
}

export default ProfilePage;
