import { useState, useEffect, useMemo } from 'react';
import {
  Package,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  ShieldAlert,
  Layers,
  Box,
  ChevronDown,
  X,
  Check,
  RotateCcw,
  User,
  Phone,
  MapPin,
  FileText,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  EyeOff,
  Save,
  DollarSign,
  Tag,
  Image as ImageIcon,
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { formatCurrency, cn } from '../lib/utils';
import { Toast } from '../components/common/Toast';

const NEWMOS_CATEGORIES = [
  { slug: 'the-thao-da-nang', name: 'Giày Thể Thao Đa Năng' },
  { slug: 'running', name: 'Giày Chạy Bộ (Running)' },
  { slug: 'running-training', name: 'Giày Chạy Bộ & Tập Luyện' },
  { slug: 'thoi-trang-chay-bo', name: 'Giày Thể Thao Thời Trang & Chạy Bộ' },
  { slug: 'lifestyle', name: 'Giày Thời Trang (Lifestyle)' },
  { slug: 'basketball', name: 'Giày Bóng Rổ (Basketball)' },
];

export function AdminPage() {
  // Tab state: 'orders' | 'inventory'
  const [activeTab, setActiveTab] = useState('orders');

  // Orders State
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  // Cancel order modal state
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('Khách yêu cầu hủy đơn');

  // Inventory State
  const [inventory, setInventory] = useState([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Product & Inventory CRUD State
  const [isCreateProductModalOpen, setIsCreateProductModalOpen] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    price: '',
    color: 'Trắng Phối Đỏ NewMos',
    categorySlug: 'the-thao-da-nang',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    description: '',
    sizeStocks: {
      '36': 15,
      '37': 20,
      '38': 25,
      '39': 20,
      '40': 15,
    },
  });
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete / Toggle Active Product State
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // Inline Stock Edit State: { [variantId]: number/string }
  const [editingStocks, setEditingStocks] = useState({});
  const [savingVariantId, setSavingVariantId] = useState(null);

  // Analytics State (Doanh thu & chỉ số kế toán chuẩn từ backend)
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    pendingRevenue: 0,
    deliveredOrdersCount: 0,
    pendingOrdersCount: 0,
    cancelledOrdersCount: 0,
    totalOrdersCount: 0,
  });
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);

  // Toast notification
  const [toast, setToast] = useState(null);

  // 1. Fetch Orders
  const fetchOrders = async (status = null) => {
    try {
      setIsLoadingOrders(true);
      const res = await adminService.getOrders(status);
      const data = res?.data || res || [];
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách đơn hàng:', err);
      setToast({
        title: 'LỖI HỆ THỐNG',
        message: err?.response?.data?.message || 'Không thể tải danh sách đơn hàng.',
        isError: true,
      });
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // 2. Fetch Inventory
  const fetchInventory = async () => {
    try {
      setIsLoadingInventory(true);
      const res = await adminService.getInventory();
      const data = res?.data || res || [];
      setInventory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách tồn kho:', err);
      setToast({
        title: 'LỖI HỆ THỐNG',
        message: err?.response?.data?.message || 'Không thể tải thông tin tồn kho.',
        isError: true,
      });
    } finally {
      setIsLoadingInventory(false);
    }
  };

  // 3. Fetch Dashboard Analytics (Theo chuẩn kế toán)
  const fetchAnalytics = async () => {
    try {
      setIsLoadingAnalytics(true);
      const res = await adminService.getDashboardAnalytics();
      const data = res?.data || res || {};
      setAnalytics({
        totalRevenue: Number(data.totalRevenue) || 0,
        pendingRevenue: Number(data.pendingRevenue) || 0,
        deliveredOrdersCount: Number(data.deliveredOrdersCount) || 0,
        pendingOrdersCount: Number(data.pendingOrdersCount) || 0,
        cancelledOrdersCount: Number(data.cancelledOrdersCount) || 0,
        totalOrdersCount: Number(data.totalOrdersCount) || 0,
      });
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu thống kê doanh thu:', err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchOrders(orderStatusFilter);
    fetchInventory();
    fetchAnalytics();
  }, []);

  const handleFilterStatusChange = (status) => {
    setOrderStatusFilter(status);
    fetchOrders(status);
  };

  // Cập nhật trạng thái đơn qua selectbox linh hoạt
  const handleUpdateStatus = async (orderId, newStatus) => {
    if (!orderId || !newStatus) return;
    setUpdatingOrderId(orderId);
    try {
      const res = await adminService.updateOrderStatus(orderId, newStatus);
      const updated = res?.data || res;

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, orderStatus: newStatus, status: newStatus }
            : o
        )
      );

      if (selectedOrderDetails && selectedOrderDetails.id === orderId) {
        setSelectedOrderDetails((prev) => ({
          ...prev,
          orderStatus: newStatus,
          status: newStatus,
        }));
      }

      // Re-fetch analytics để đồng bộ doanh thu tức thì
      fetchAnalytics();

      setToast({
        title: 'CẬP NHẬT THÀNH CÔNG',
        message: `Đơn hàng #${updated?.orderCode || orderId} đã chuyển sang trạng thái ${newStatus}`,
      });
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái:', err);
      setToast({
        title: 'CẬP NHẬT THẤT BẠI',
        message: err?.response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng.',
        isError: true,
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Workflow Action: Duyệt đơn (PENDING -> CONFIRMED)
  const handleApproveOrder = async (orderId, orderCode) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await adminService.approveOrder(orderId);
      const updated = res?.data || res;

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, orderStatus: 'CONFIRMED', status: 'CONFIRMED' }
            : o
        )
      );

      if (selectedOrderDetails && selectedOrderDetails.id === orderId) {
        setSelectedOrderDetails((prev) => ({
          ...prev,
          orderStatus: 'CONFIRMED',
          status: 'CONFIRMED',
        }));
      }

      // Re-fetch analytics để đồng bộ doanh thu tức thì
      fetchAnalytics();

      setToast({
        title: 'ĐÃ DUYỆT ĐƠN HÀNG THÀNH CÔNG',
        message: `Đơn hàng #${orderCode || orderId} đã được xác nhận và sẵn sàng đóng gói!`,
      });
    } catch (err) {
      console.error('Lỗi khi duyệt đơn:', err);
      setToast({
        title: 'DUYỆT ĐƠN THẤT BẠI',
        message: err?.response?.data?.message || 'Không thể duyệt đơn hàng.',
        isError: true,
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Workflow Action: Xác nhận giao hàng (CONFIRMED -> SHIPPING)
  const handleShipOrder = async (orderId, orderCode) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await adminService.shipOrder(orderId);
      const updated = res?.data || res;

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, orderStatus: 'SHIPPING', status: 'SHIPPING' }
            : o
        )
      );

      if (selectedOrderDetails && selectedOrderDetails.id === orderId) {
        setSelectedOrderDetails((prev) => ({
          ...prev,
          orderStatus: 'SHIPPING',
          status: 'SHIPPING',
        }));
      }

      // Re-fetch analytics để đồng bộ chỉ số
      fetchAnalytics();

      setToast({
        title: 'ĐÃ XÁC NHẬN GIAO HÀNG',
        message: `Đơn hàng #${orderCode || orderId} đã bàn giao cho đơn vị vận chuyển NewMos Express!`,
      });
    } catch (err) {
      console.error('Lỗi khi chuyển giao hàng:', err);
      setToast({
        title: 'THAO TÁC THẤT BẠI',
        message: err?.response?.data?.message || 'Không thể cập nhật trạng thái vận chuyển.',
        isError: true,
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Workflow Action: Xác nhận giao thành công (SHIPPING -> DELIVERED)
  const handleCompleteOrder = async (orderId, orderCode) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await adminService.completeOrder(orderId);
      const updated = res?.data || res;

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, orderStatus: 'DELIVERED', status: 'DELIVERED' }
            : o
        )
      );

      if (selectedOrderDetails && selectedOrderDetails.id === orderId) {
        setSelectedOrderDetails((prev) => ({
          ...prev,
          orderStatus: 'DELIVERED',
          status: 'DELIVERED',
        }));
      }

      // Re-fetch analytics: Doanh thu thực nhận sẽ nhảy tăng ngay lập tức khi đơn DELIVERED!
      fetchAnalytics();

      setToast({
        title: 'GIAO HÀNG THÀNH CÔNG',
        message: `Đơn hàng #${orderCode || orderId} đã hoàn tất thanh toán và giao đến khách hàng!`,
      });
    } catch (err) {
      console.error('Lỗi khi hoàn thành đơn:', err);
      setToast({
        title: 'THAO TÁC THẤT BẠI',
        message: err?.response?.data?.message || 'Không thể hoàn thành đơn hàng.',
        isError: true,
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Workflow Action: Hủy đơn hàng kèm lý do và hoàn tồn kho (restock)
  const handleConfirmCancelOrder = async () => {
    if (!cancellingOrder) return;
    const { id: orderId, orderCode } = cancellingOrder;
    setUpdatingOrderId(orderId);
    try {
      const res = await adminService.cancelOrder(orderId, cancelReasonInput);
      const updated = res?.data || res;

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                orderStatus: 'CANCELLED',
                status: 'CANCELLED',
                cancelReason: cancelReasonInput,
              }
            : o
        )
      );

      if (selectedOrderDetails && selectedOrderDetails.id === orderId) {
        setSelectedOrderDetails((prev) => ({
          ...prev,
          orderStatus: 'CANCELLED',
          status: 'CANCELLED',
          cancelReason: cancelReasonInput,
        }));
      }

      // Tự động tải lại kho và chỉ số tài chính vì tồn kho vừa được restock
      fetchInventory();
      fetchAnalytics();

      setToast({
        title: 'ĐÃ HỦY ĐƠN & HOÀN LẠI TỒN KHO',
        message: `Đơn hàng #${orderCode || orderId} đã hủy. Số lượng giày đã tự động hoàn vào kho!`,
      });

      setCancellingOrder(null);
    } catch (err) {
      console.error('Lỗi khi hủy đơn hàng:', err);
      setToast({
        title: 'HỦY ĐƠN THẤT BẠI',
        message: err?.response?.data?.message || 'Không thể hủy đơn hàng.',
        isError: true,
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // 1. Cập nhật trực tiếp số lượng tồn kho biến thể size (PUT /variants/{id}/stock)
  const handleSaveVariantStock = async (variantId, productId) => {
    const rawVal = editingStocks[variantId];
    if (rawVal === undefined || rawVal === '') return;
    const parsedStock = Math.max(0, parseInt(rawVal, 10) || 0);

    try {
      setSavingVariantId(variantId);
      await adminService.updateVariantStock(variantId, parsedStock);

      // Cập nhật ngay lập tức state inventory cục bộ mà không cần tải lại toàn bộ trang
      setInventory((prev) =>
        prev.map((prod) => {
          if (prod.productId !== productId) return prod;
          let newTotalStock = 0;
          let newLowStockCount = 0;

          const updatedVariants = (prod.variants || []).map((v) => {
            if (v.id === variantId) {
              const stock = parsedStock;
              const isLow = stock <= 3;
              newTotalStock += stock;
              if (isLow) newLowStockCount++;
              return { ...v, stockQuantity: stock, isLowStock: isLow };
            }
            newTotalStock += v.stockQuantity || 0;
            if (v.isLowStock || (v.stockQuantity || 0) <= 3) newLowStockCount++;
            return v;
          });

          return {
            ...prod,
            variants: updatedVariants,
            totalStock: newTotalStock,
            lowStockCount: newLowStockCount,
          };
        })
      );

      // Xóa pending edit của variant này
      setEditingStocks((prev) => {
        const next = { ...prev };
        delete next[variantId];
        return next;
      });

      setToast({
        title: 'CẬP NHẬT TỒN KHO THÀNH CÔNG',
        message: `Đã cập nhật tồn kho biến thể thành ${parsedStock} đôi.`,
      });
    } catch (err) {
      console.error('Lỗi khi cập nhật tồn kho biến thể:', err);
      setToast({
        title: 'CẬP NHẬT TỒN KHO THẤT BẠI',
        message: err?.response?.data?.message || 'Không thể cập nhật tồn kho biến thể.',
        isError: true,
      });
    } finally {
      setSavingVariantId(null);
    }
  };

  // 2. Thêm mới sản phẩm kèm 5 size chuẩn (POST /products)
  const handleCreateProduct = async (e) => {
    if (e) e.preventDefault();
    if (!newProductForm.name.trim()) {
      setToast({ title: 'THIẾU THÔNG TIN', message: 'Vui lòng nhập tên sản phẩm.', isError: true });
      return;
    }
    if (!newProductForm.price || Number(newProductForm.price) <= 0) {
      setToast({ title: 'THIẾU THÔNG TIN', message: 'Vui lòng nhập giá niêm yết hợp lệ (> 0).', isError: true });
      return;
    }

    try {
      setIsSavingProduct(true);
      const payload = {
        name: newProductForm.name.trim(),
        price: Number(newProductForm.price),
        color: newProductForm.color.trim() || 'Bản Tiêu Chuẩn',
        categorySlug: newProductForm.categorySlug,
        imageUrl: newProductForm.imageUrl.trim() || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
        description: newProductForm.description.trim(),
        sizeStocks: ['36', '37', '38', '39', '40'].map((sz) => ({
          size: sz,
          stockQuantity: Number(newProductForm.sizeStocks[sz]) || 0,
        })),
      };

      await adminService.createProduct(payload);
      setToast({
        title: 'THÊM GIÀY MỚI THÀNH CÔNG',
        message: `Đã thêm mẫu giày "${newProductForm.name}" kèm 5 size chuẩn (36 - 40).`,
      });

      setIsCreateProductModalOpen(false);
      setNewProductForm({
        name: '',
        price: '',
        color: 'Trắng Phối Đỏ NewMos',
        categorySlug: 'the-thao-da-nang',
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
        description: '',
        sizeStocks: { '36': 15, '37': 20, '38': 25, '39': 20, '40': 15 },
      });

      await fetchInventory();
    } catch (err) {
      console.error('Lỗi khi thêm sản phẩm:', err);
      setToast({
        title: 'THÊM SẢN PHẨM THẤT BẠI',
        message: err?.response?.data?.message || 'Không thể tạo mới sản phẩm.',
        isError: true,
      });
    } finally {
      setIsSavingProduct(false);
    }
  };

  // 3. Sửa thông tin sản phẩm (PUT /products/{id})
  const handleUpdateProduct = async (e) => {
    if (e) e.preventDefault();
    if (!editingProduct || !editingProduct.productName.trim()) return;

    try {
      setIsSavingEdit(true);
      const payload = {
        name: editingProduct.productName.trim(),
        price: Number(editingProduct.price) || 0,
        description: editingProduct.description || '',
        categorySlug: editingProduct.categorySlug,
        imageUrl: editingProduct.defaultThumbnail,
        color: editingProduct.color,
        isActive: editingProduct.isActive !== undefined ? editingProduct.isActive : true,
      };

      await adminService.updateProduct(editingProduct.productId, payload);
      setToast({
        title: 'CẬP NHẬT THÀNH CÔNG',
        message: `Đã lưu các thay đổi cho "${editingProduct.productName}".`,
      });

      setEditingProduct(null);
      await fetchInventory();
    } catch (err) {
      console.error('Lỗi khi cập nhật sản phẩm:', err);
      setToast({
        title: 'CẬP NHẬT THẤT BẠI',
        message: err?.response?.data?.message || 'Không thể cập nhật sản phẩm.',
        isError: true,
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  // 4. Xóa / Ẩn sản phẩm (DELETE /products/{id})
  const handleToggleDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      setIsDeletingProduct(true);
      const res = await adminService.deleteProduct(deletingProduct.productId, false);
      const newStatus = res?.data !== undefined ? res.data : !deletingProduct.isActive;

      setToast({
        title: newStatus ? 'KÍCH HOẠT THÀNH CÔNG' : 'ẨN SẢN PHẨM THÀNH CÔNG',
        message: newStatus
          ? `Mẫu giày "${deletingProduct.productName}" đã được kích hoạt hiển thị trên Shop.`
          : `Mẫu giày "${deletingProduct.productName}" đã được ẩn khỏi Shop an toàn.`,
      });

      setDeletingProduct(null);
      await fetchInventory();
    } catch (err) {
      console.error('Lỗi khi ẩn/xóa sản phẩm:', err);
      setToast({
        title: 'THAO TÁC THẤT BẠI',
        message: err?.response?.data?.message || 'Không thể thay đổi trạng thái sản phẩm.',
        isError: true,
      });
    } finally {
      setIsDeletingProduct(false);
    }
  };

  // Lọc danh sách đơn hàng theo từ khóa
  const filteredOrders = useMemo(() => {
    if (!orderSearchQuery.trim()) return orders;
    const q = orderSearchQuery.toLowerCase();
    return orders.filter((o) => {
      const code = (o.orderCode || '').toLowerCase();
      const name = (o.customerName || o.recipientName || '').toLowerCase();
      const phone = (o.phone || o.recipientPhone || '').toLowerCase();
      return code.includes(q) || name.includes(q) || phone.includes(q);
    });
  }, [orders, orderSearchQuery]);

  // Lọc danh sách tồn kho theo từ khóa và tùy chọn low stock
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchesSearch =
        !inventorySearchQuery.trim() ||
        (item.productName || '').toLowerCase().includes(inventorySearchQuery.toLowerCase()) ||
        (item.productCode || '').toLowerCase().includes(inventorySearchQuery.toLowerCase()) ||
        (item.brandName || '').toLowerCase().includes(inventorySearchQuery.toLowerCase()) ||
        (item.categoryName || '').toLowerCase().includes(inventorySearchQuery.toLowerCase());

      const matchesLowStock = !onlyLowStock || item.lowStockCount > 0;

      return matchesSearch && matchesLowStock;
    });
  }, [inventory, inventorySearchQuery, onlyLowStock]);

  // Thống kê tổng quan (Metrics KPI theo chuẩn kế toán từ backend)
  const metrics = useMemo(() => {
    const totalRevenue = analytics.totalRevenue ?? 0;
    const pendingRevenue = analytics.pendingRevenue ?? 0;

    const pendingOrders = analytics.pendingOrdersCount ?? orders.filter((o) => (o.orderStatus || o.status) === 'PENDING').length;
    const confirmedOrders = orders.filter((o) => (o.orderStatus || o.status) === 'CONFIRMED').length;
    const shippingOrders = orders.filter((o) => ['SHIPPING', 'SHIPPED'].includes(o.orderStatus || o.status)).length;
    const completedOrders = analytics.deliveredOrdersCount ?? orders.filter((o) => ['DELIVERED', 'COMPLETED'].includes(o.orderStatus || o.status)).length;
    const cancelledOrders = analytics.cancelledOrdersCount ?? orders.filter((o) => (o.orderStatus || o.status) === 'CANCELLED').length;
    const totalOrders = analytics.totalOrdersCount > 0 ? analytics.totalOrdersCount : orders.length;

    let totalStockUnits = 0;
    let totalLowStockVariants = 0;
    inventory.forEach((p) => {
      totalStockUnits += p.totalStock || 0;
      totalLowStockVariants += p.lowStockCount || 0;
    });

    return {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippingOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue,
      pendingRevenue,
      totalStockUnits,
      totalLowStockVariants,
    };
  }, [orders, inventory, analytics]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase bg-amber-50 text-amber-700 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" /> Chờ duyệt
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase bg-blue-50 text-blue-700 border border-blue-300">
            <Check className="w-3 h-3 text-blue-600" /> Đã duyệt
          </span>
        );
      case 'SHIPPING':
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase bg-purple-50 text-purple-700 border border-purple-300">
            <Truck className="w-3 h-3 text-purple-600" /> Đang giao
          </span>
        );
      case 'DELIVERED':
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã giao
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase bg-rose-50 text-rose-700 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-600" /> Đã hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase bg-slate-100 text-slate-700 border border-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20 font-sans">
      {/* Top Banner: NewMos Command Center Header */}
      <section className="bg-[#0A0A0A] text-white border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="px-2.5 py-0.5 rounded bg-[#DC2626] text-white text-[10px] font-mono font-black uppercase tracking-wider">
                  QUẢN TRỊ VIÊN // ORDER APPROVAL & FULFILLMENT HUB
                </span>
                <span className="text-xs font-mono text-neutral-400">
                  NEW MOS v3.1 ACTIVE
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                <ShieldAlert className="w-8 h-8 text-[#DC2626]" />
                QUẢN LÝ QUY TRÌNH ĐƠN HÀNG & KHO NEWMOS
              </h1>
              <p className="text-xs text-neutral-400 mt-1 font-sans max-w-2xl">
                Phê duyệt đơn hàng chờ, điều phối giao nhận tự động, hoàn tồn kho khi hủy đơn và kiểm soát định mức kho theo thời gian thực.
              </p>
            </div>

            {/* Quick Refresh */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  fetchOrders(orderStatusFilter);
                  fetchInventory();
                  fetchAnalytics();
                }}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
              >
                <RefreshCw className={cn('w-3.5 h-3.5 text-[#DC2626]', (isLoadingOrders || isLoadingInventory || isLoadingAnalytics) && 'animate-spin')} />
                LÀM MỚI DỮ LIỆU
              </button>
            </div>
          </div>

          {/* 5 Metric Cards (Chuẩn Kế Toán Tài Chính) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mt-8">
            {/* Card 1: Doanh Thu Thực Nhận (Đã giao) */}
            <div className="bg-[#0e1611] border border-emerald-800/40 p-4 rounded-xl shadow-xs relative overflow-hidden group hover:border-emerald-600/60 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">Doanh Thu Thực Nhận (Đã giao)</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xl sm:text-2xl font-black font-mono text-emerald-300 mt-2">
                {formatCurrency(metrics.totalRevenue)}
              </p>
              <span className="text-[10px] text-neutral-400 font-mono block mt-1">
                Chỉ tính trên các đơn hàng đã hoàn tất giao hàng
              </span>
            </div>

            {/* Card 2: Doanh Thu Đang Treo (Dự kiến) */}
            <div className="bg-[#17140e] border border-amber-800/40 p-4 rounded-xl shadow-xs relative overflow-hidden group hover:border-amber-600/60 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400">Doanh Thu Đang Treo (Dự kiến)</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-xl sm:text-2xl font-black font-mono text-amber-300 mt-2">
                {formatCurrency(metrics.pendingRevenue)}
              </p>
              <span className="text-[10px] text-neutral-400 font-mono block mt-1">
                Đơn chờ duyệt, đã duyệt & đang giao
              </span>
            </div>

            {/* Card 3: Đơn Chờ Duyệt */}
            <div className="bg-[#141414] border border-neutral-800 p-4 rounded-xl shadow-xs relative overflow-hidden group hover:border-neutral-700 transition-all">
              {metrics.pendingOrders > 0 && (
                <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500 animate-ping m-2" />
              )}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400">Đơn Chờ Duyệt (Pending)</span>
                <AlertCircle className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-xl sm:text-2xl font-black font-mono text-amber-400 mt-2 flex items-center gap-2">
                {metrics.pendingOrders}
                {metrics.pendingOrders > 0 && (
                  <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded bg-red-600 text-white animate-pulse">
                    CẦN XỬ LÝ
                  </span>
                )}
              </p>
              <span className="text-[10px] text-neutral-500 font-mono block mt-1">Bấm duyệt đơn ngay phía dưới</span>
            </div>

            {/* Card 4: Đã Giao Thành Công */}
            <div className="bg-[#141414] border border-neutral-800 p-4 rounded-xl shadow-xs relative overflow-hidden group hover:border-neutral-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400">Đã Giao Thành Công</span>
                <ShoppingBag className="w-4 h-4 text-[#DC2626]" />
              </div>
              <p className="text-xl sm:text-2xl font-black font-mono text-white mt-2">
                {metrics.completedOrders}
              </p>
              <span className="text-[10px] text-neutral-500 font-mono block mt-1">
                Đơn hàng hoàn tất hợp lệ
              </span>
            </div>

            {/* Card 5: Cảnh Báo Tồn Kho */}
            <div className="bg-[#141414] border border-neutral-800 p-4 rounded-xl shadow-xs relative overflow-hidden group hover:border-neutral-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400">Cảnh Báo Tồn Kho</span>
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-xl sm:text-2xl font-black font-mono text-red-500 mt-2">
                {metrics.totalLowStockVariants} <span className="text-xs font-normal text-neutral-400">size</span>
              </p>
              <span className="text-[10px] text-neutral-500 font-mono block mt-1">Số lượng tồn kho ≤ 3 đôi</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-3 mt-8 border-b border-neutral-800">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={cn(
                'pb-3 text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer',
                activeTab === 'orders'
                  ? 'border-[#DC2626] text-white'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              )}
            >
              <ShoppingBag className="w-4 h-4 text-[#DC2626]" />
              <span>TAB 1: QUY TRÌNH & ĐƠN HÀNG ({orders.length})</span>
              {metrics.pendingOrders > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#DC2626] text-white text-[9px] font-mono font-black animate-pulse">
                  {metrics.pendingOrders}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className={cn(
                'pb-3 text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer',
                activeTab === 'inventory'
                  ? 'border-[#DC2626] text-white'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              )}
            >
              <Layers className="w-4 h-4 text-[#DC2626]" />
              <span>TAB 2: KIỂM SOÁT TỒN KHO ({inventory.length} MẪU)</span>
              {metrics.totalLowStockVariants > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[9px] font-mono font-bold animate-pulse">
                  {metrics.totalLowStockVariants}
                </span>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Main Workspace Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ========================================================= */}
        {/* TAB 1: QUẢN LÝ ĐƠN HÀNG & QUY TRÌNH PHÊ DUYỆT (ORDERS) */}
        {/* ========================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm mã đơn NM-XXXXXX, tên khách, số điện thoại..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-sans"
                />
                {orderSearchQuery && (
                  <button
                    onClick={() => setOrderSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status pill filter buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-slate-400" /> Lọc:
                </span>
                {[
                  { key: 'ALL', label: 'TẤT CẢ' },
                  { key: 'PENDING', label: 'CHỜ DUYỆT', count: metrics.pendingOrders },
                  { key: 'CONFIRMED', label: 'ĐÃ DUYỆT', count: metrics.confirmedOrders },
                  { key: 'SHIPPING', label: 'ĐANG GIAO', count: metrics.shippingOrders },
                  { key: 'DELIVERED', label: 'ĐÃ HOÀN THÀNH', count: metrics.completedOrders },
                  { key: 'CANCELLED', label: 'ĐÃ HỦY', count: metrics.cancelledOrders },
                ].map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => handleFilterStatusChange(st.key)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-[11px] font-bold font-mono uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5',
                      orderStatusFilter === st.key
                        ? 'bg-[#0A0A0A] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    <span>{st.label}</span>
                    {st.count !== undefined && st.count > 0 && (
                      <span
                        className={cn(
                          'px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold',
                          st.key === 'PENDING'
                            ? 'bg-[#DC2626] text-white animate-pulse'
                            : 'bg-slate-200 text-slate-700'
                        )}
                      >
                        {st.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono uppercase text-[11px]">
                      <th className="py-3.5 px-4 font-bold">Mã Đơn</th>
                      <th className="py-3.5 px-4 font-bold">Khách Hàng</th>
                      <th className="py-3.5 px-4 font-bold">Số Điện Thoại</th>
                      <th className="py-3.5 px-4 font-bold">Tổng Tiền</th>
                      <th className="py-3.5 px-4 font-bold">Ngày Tạo</th>
                      <th className="py-3.5 px-4 font-bold">Trạng Thái</th>
                      <th className="py-3.5 px-4 font-bold text-center">Hành Động Quy Trình</th>
                      <th className="py-3.5 px-4 font-bold text-right">Chi Tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {isLoadingOrders ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-slate-500">
                          <RefreshCw className="w-6 h-6 mx-auto animate-spin text-[#DC2626] mb-2" />
                          <p className="font-bold">Đang tải danh sách đơn hàng...</p>
                        </td>
                      </tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-slate-500">
                          <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                          <p className="font-bold text-slate-700">Không tìm thấy đơn hàng nào</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {orderSearchQuery
                              ? `Không có kết quả khớp với "${orderSearchQuery}"`
                              : 'Chưa có đơn hàng nào trong nhóm trạng thái này.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => {
                        const isUpdating = updatingOrderId === order.id;
                        const currentStatus = order.orderStatus || order.status || 'PENDING';
                        const totalAmount = Number(order.totalAmount || 0);

                        return (
                          <tr
                            key={order.id}
                            className={cn(
                              'hover:bg-slate-50/80 transition-colors',
                              currentStatus === 'PENDING' && 'bg-amber-50/20'
                            )}
                          >
                            {/* Mã đơn (click mở modal chi tiết) */}
                            <td className="py-3.5 px-4 font-mono font-black text-slate-900">
                              <button
                                type="button"
                                onClick={() => setSelectedOrderDetails(order)}
                                className="text-red-600 hover:text-red-800 hover:underline cursor-pointer flex items-center gap-1"
                                title="Bấm để xem chi tiết đơn hàng"
                              >
                                <span>#{order.orderCode}</span>
                              </button>
                            </td>

                            {/* Khách hàng */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900">
                                {order.customerName || order.recipientName || 'Khách vãng lai'}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate max-w-[180px]" title={order.shippingAddress}>
                                {order.shippingAddress || 'Chưa cung cấp địa chỉ'}
                              </div>
                            </td>

                            {/* Số điện thoại */}
                            <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                              {order.phone || order.recipientPhone || '—'}
                            </td>

                            {/* Tổng tiền */}
                            <td className="py-3.5 px-4 font-mono font-black text-slate-900">
                              {formatCurrency(totalAmount)}
                            </td>

                            {/* Ngày tạo */}
                            <td className="py-3.5 px-4 text-slate-500 text-[11px] font-mono">
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleString('vi-VN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : '—'}
                            </td>

                            {/* Trạng thái hiện tại */}
                            <td className="py-3.5 px-4">
                              {getStatusBadge(currentStatus)}
                            </td>

                            {/* Nút hành động nhanh quy trình xử lý đơn */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {currentStatus === 'PENDING' && (
                                  <>
                                    <button
                                      type="button"
                                      disabled={isUpdating}
                                      onClick={() => handleApproveOrder(order.id, order.orderCode)}
                                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                                      title="Duyệt đơn hàng và chuyển sang Đã xác nhận"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Duyệt đơn</span>
                                    </button>

                                    <button
                                      type="button"
                                      disabled={isUpdating}
                                      onClick={() => setCancellingOrder(order)}
                                      className="px-2.5 py-1.5 rounded-lg border border-rose-300 hover:bg-rose-50 text-rose-700 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                                      title="Hủy đơn và hoàn lại số lượng tồn kho"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                      <span>Hủy</span>
                                    </button>
                                  </>
                                )}

                                {currentStatus === 'CONFIRMED' && (
                                  <>
                                    <button
                                      type="button"
                                      disabled={isUpdating}
                                      onClick={() => handleShipOrder(order.id, order.orderCode)}
                                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                                      title="Xác nhận giao hàng cho bưu tá NewMos"
                                    >
                                      <Truck className="w-3.5 h-3.5" />
                                      <span>Giao hàng</span>
                                    </button>

                                    <button
                                      type="button"
                                      disabled={isUpdating}
                                      onClick={() => setCancellingOrder(order)}
                                      className="px-2 py-1 rounded text-slate-400 hover:text-rose-600 text-[10px] font-bold uppercase transition-all cursor-pointer"
                                      title="Hủy đơn"
                                    >
                                      Hủy
                                    </button>
                                  </>
                                )}

                                {['SHIPPING', 'SHIPPED'].includes(currentStatus) && (
                                  <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => handleCompleteOrder(order.id, order.orderCode)}
                                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                                    title="Xác nhận khách đã nhận hàng và thanh toán"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Đã giao xong</span>
                                  </button>
                                )}

                                {['DELIVERED', 'COMPLETED'].includes(currentStatus) && (
                                  <span className="text-emerald-700 font-bold font-mono text-[11px] flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn tất
                                  </span>
                                )}

                                {currentStatus === 'CANCELLED' && (
                                  <span
                                    className="text-rose-600 font-bold font-mono text-[11px] flex items-center gap-1"
                                    title={order.cancelReason ? `Lý do: ${order.cancelReason}` : 'Đơn đã hủy'}
                                  >
                                    <XCircle className="w-3.5 h-3.5" /> Đã hủy
                                  </span>
                                )}

                                {isUpdating && (
                                  <RefreshCw className="w-3.5 h-3.5 text-[#DC2626] animate-spin ml-1" />
                                )}
                              </div>
                            </td>

                            {/* Nút Xem chi tiết */}
                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedOrderDetails(order)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-100 text-slate-700 hover:text-black transition-all cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold"
                                title="Xem danh sách sản phẩm và thông tin giao hàng"
                              >
                                <Eye className="w-3.5 h-3.5" /> Chi tiết
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 font-mono">
                <span>Hiển thị {filteredOrders.length} / {orders.length} đơn hàng</span>
                <span className="text-emerald-600 font-bold">Hệ thống đồng bộ tự động Restock khi hủy đơn</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: KIỂM SOÁT TỒN KHO & QUẢN LÝ SẢN PHẨM (INVENTORY) */}
        {/* ========================================================= */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Header Action Bar: Search, Filters & "+ THÊM GIÀY MỚI" Button */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên mẫu giày, mã SKU, danh mục..."
                  value={inventorySearchQuery}
                  onChange={(e) => setInventorySearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-sans"
                />
                {inventorySearchQuery && (
                  <button
                    onClick={() => setInventorySearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Action buttons on right */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Low stock filter toggle */}
                <button
                  type="button"
                  onClick={() => setOnlyLowStock(!onlyLowStock)}
                  className={cn(
                    'px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 border transition-all cursor-pointer',
                    onlyLowStock
                      ? 'bg-red-50 border-red-500 text-[#DC2626] ring-2 ring-red-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  )}
                >
                  <AlertTriangle className={cn('w-4 h-4', onlyLowStock ? 'text-[#DC2626]' : 'text-slate-400')} />
                  <span>Sắp hết hàng (≤ 3)</span>
                </button>

                {/* Primary Action: + THÊM GIÀY MỚI (NewMos Red) */}
                <button
                  type="button"
                  onClick={() => setIsCreateProductModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-red-600/25 transition-all cursor-pointer active:scale-95 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ THÊM GIÀY MỚI</span>
                </button>
              </div>
            </div>

            {/* Product & Quick Inventory Table */}
            <div className="space-y-4">
              {isLoadingInventory ? (
                <div className="bg-white rounded-xl border border-slate-200 p-16 text-center text-slate-500 shadow-xs">
                  <RefreshCw className="w-6 h-6 mx-auto animate-spin text-[#DC2626] mb-2" />
                  <p className="font-bold">Đang kiểm tra tồn kho từ database...</p>
                </div>
              ) : filteredInventory.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-16 text-center text-slate-500 shadow-xs">
                  <Box className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-slate-700">Không tìm thấy sản phẩm nào</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {onlyLowStock ? 'Không có mẫu giày nào đang ở mức báo động tồn kho ≤ 3.' : 'Chưa có sản phẩm nào trong kho.'}
                  </p>
                </div>
              ) : (
                filteredInventory.map((item) => {
                  const isProductHidden = item.isActive === false;

                  return (
                    <div
                      key={item.productId}
                      className={cn(
                        'bg-white rounded-2xl border transition-all p-5 shadow-xs relative overflow-hidden',
                        isProductHidden
                          ? 'border-dashed border-slate-300 bg-slate-50/50 opacity-80'
                          : 'border-slate-200 hover:border-slate-300'
                      )}
                    >
                      {/* Top Row: Thumbnail, Name, List Price, Actions */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        {/* Shoe Overview */}
                        <div className="flex items-center gap-4">
                          <img
                            src={
                              item.defaultThumbnail ||
                              'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80'
                            }
                            alt={item.productName}
                            className="w-16 h-16 rounded-xl object-contain bg-slate-50 border border-slate-200 p-1.5 shrink-0 shadow-2xs"
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-slate-900 text-white tracking-wider">
                                {item.brandName || 'NEWMOS'}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                MÃ: {item.productCode}
                              </span>
                              {isProductHidden ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-slate-200 text-slate-600">
                                  <EyeOff className="w-3 h-3" /> Đã ẩn khỏi Shop
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-700">
                                  <Check className="w-3 h-3" /> Đang bán
                                </span>
                              )}
                              {item.lowStockCount > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-red-100 text-red-600 border border-red-200 animate-pulse">
                                  <AlertTriangle className="w-3 h-3" /> {item.lowStockCount} size sắp hết
                                </span>
                              )}
                            </div>

                            <h3 className="text-base font-black uppercase text-slate-950 mt-1 flex items-center gap-2">
                              {item.productName}
                            </h3>

                            <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 font-sans">
                              <span>
                                Danh mục: <strong className="text-slate-800">{item.categoryName}</strong>
                              </span>
                              {item.color && (
                                <span>
                                  Phối màu: <strong className="text-slate-800">{item.color}</strong>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* List Price & Total Stock & Actions */}
                        <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 flex-wrap">
                          {/* List Price Badge */}
                          <div className="text-right px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-[10px] uppercase text-slate-400 block font-bold font-mono">Giá Niêm Yết</span>
                            <span className="text-base font-black font-mono text-red-600">
                              {formatCurrency(item.price || 0)}
                            </span>
                          </div>

                          {/* Total Stock Badge */}
                          <div className="text-right px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-mono">
                            <span className="text-[10px] uppercase text-slate-400 block font-bold">Tổng Tồn Kho</span>
                            <span className="text-base font-black text-slate-900">
                              {item.totalStock} <span className="text-xs font-normal text-slate-500">đôi</span>
                            </span>
                          </div>

                          {/* Action Buttons: Sửa thông tin & Xóa/Ẩn */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingProduct({ ...item })}
                              className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                              title="Sửa thông tin sản phẩm"
                            >
                              <Pencil className="w-3.5 h-3.5 text-slate-500" />
                              <span>Sửa</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeletingProduct(item)}
                              className={cn(
                                'px-3 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer active:scale-95',
                                isProductHidden
                                  ? 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                                  : 'border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700'
                              )}
                              title={isProductHidden ? 'Hiện lại sản phẩm trên Shop' : 'Ẩn sản phẩm khỏi Shop'}
                            >
                              {isProductHidden ? (
                                <>
                                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Hiện lại</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Ẩn / Xóa</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Section: Fast Inline Inventory Management for Sizes */}
                      <div className="pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-[11px] font-mono font-bold uppercase text-slate-500 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-[#DC2626]" /> QUẢN LÝ TỒN KHO TRỰC TIẾP TỪNG SIZE (CHỈNH SỬA & LƯU TỨC THÌ):
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                            Nhập số lượng & bấm nút tick xanh để cập nhật ngay
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                          {item.variants && item.variants.length > 0 ? (
                            item.variants.map((v) => {
                              const currentVal = editingStocks[v.id] !== undefined ? editingStocks[v.id] : v.stockQuantity;
                              const isEdited = editingStocks[v.id] !== undefined && Number(editingStocks[v.id]) !== v.stockQuantity;
                              const isCriticallyLow = (Number(currentVal) <= 3);
                              const isSavingThis = savingVariantId === v.id;

                              return (
                                <div
                                  key={v.id}
                                  className={cn(
                                    'p-3 rounded-xl border transition-all flex flex-col justify-between relative',
                                    isCriticallyLow
                                      ? 'bg-red-50/90 border-red-500 ring-1 ring-red-400/40 text-red-950'
                                      : 'bg-slate-50 border-slate-200 text-slate-800'
                                  )}
                                >
                                  {/* Size Header */}
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-black font-mono">
                                      Size {v.sizeEu || v.sizeUs}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-400 truncate max-w-[80px]" title={v.sku}>
                                      {v.sku}
                                    </span>
                                  </div>

                                  {/* Inline Edit Input & Save Button */}
                                  <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between gap-1.5">
                                    <span className="text-[11px] font-mono font-bold text-slate-500 uppercase shrink-0">
                                      Tồn kho:
                                    </span>

                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="number"
                                        min="0"
                                        value={currentVal}
                                        onChange={(e) =>
                                          setEditingStocks((prev) => ({
                                            ...prev,
                                            [v.id]: e.target.value,
                                          }))
                                        }
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleSaveVariantStock(v.id, item.productId);
                                          }
                                        }}
                                        className={cn(
                                          'w-16 px-2 py-1 text-center font-mono font-black text-sm rounded-lg border focus:outline-none transition-all',
                                          isCriticallyLow
                                            ? 'border-red-400 bg-white text-red-600 focus:border-red-600 focus:ring-1 focus:ring-red-600'
                                            : 'border-slate-300 bg-white text-slate-900 focus:border-slate-500 focus:ring-1 focus:ring-slate-500'
                                        )}
                                      />
                                      <span className="text-xs font-mono text-slate-500 font-medium">đôi</span>

                                      {/* Quick Save Tick Button */}
                                      <button
                                        type="button"
                                        disabled={isSavingThis || !isEdited}
                                        onClick={() => handleSaveVariantStock(v.id, item.productId)}
                                        className={cn(
                                          'p-1.5 rounded-lg text-white transition-all cursor-pointer active:scale-90',
                                          isEdited
                                            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-xs animate-bounce'
                                            : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-50'
                                        )}
                                        title={isEdited ? 'Lưu số lượng tồn kho mới' : 'Chưa có thay đổi'}
                                      >
                                        {isSavingThis ? (
                                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <Check className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    </div>
                                  </div>

                                  {/* Warning Indicator */}
                                  <div className="mt-2 text-center">
                                    {isCriticallyLow ? (
                                      <span className="inline-block w-full py-0.5 rounded bg-red-600 text-white text-[9px] font-mono font-black uppercase tracking-wider animate-pulse shadow-2xs">
                                        {Number(currentVal) <= 0 ? 'HẾT HÀNG' : `SẮP HẾT HÀNG (${currentVal})`}
                                      </span>
                                    ) : (
                                      <span className="inline-block w-full py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px] font-mono font-bold uppercase">
                                        ĐỦ HÀNG ({currentVal})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="col-span-full text-xs text-slate-400 italic py-2">
                              Chưa có biến thể size nào được tạo cho mẫu giày này.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* MODAL 1: CHI TIẾT ĐƠN HÀNG & DUYỆT TRỰC TIẾP */}
      {/* ========================================================= */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
          <div
            onClick={() => setSelectedOrderDetails(null)}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          <div className="min-h-full flex items-center justify-center p-4">
            <div className="relative w-full max-w-2xl bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-mono font-black text-red-600">
                      #{selectedOrderDetails.orderCode}
                    </span>
                    {getStatusBadge(selectedOrderDetails.orderStatus || selectedOrderDetails.status)}
                  </div>
                  <h3 className="text-lg font-black uppercase text-slate-900 mt-1">
                    Chi Tiết Đơn Hàng & Quy Trình Xử Lý
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrderDetails(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Customer Info Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Người nhận:
                  </span>
                  <span className="font-bold text-slate-900">
                    {selectedOrderDetails.customerName || selectedOrderDetails.recipientName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Số điện thoại:
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedOrderDetails.phone || selectedOrderDetails.recipientPhone}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Địa chỉ giao:
                  </span>
                  <span className="font-medium text-slate-900 text-right">
                    {selectedOrderDetails.shippingAddress}
                  </span>
                </div>
                {selectedOrderDetails.orderNotes && (
                  <div className="flex items-start justify-between gap-4 pt-1.5 border-t border-slate-200/60">
                    <span className="text-slate-500 flex items-center gap-1.5 font-medium shrink-0">
                      <FileText className="w-3.5 h-3.5 text-slate-400" /> Ghi chú khách:
                    </span>
                    <span className="italic text-slate-700 text-right">
                      {selectedOrderDetails.orderNotes}
                    </span>
                  </div>
                )}
                {selectedOrderDetails.cancelReason && (
                  <div className="flex items-start justify-between gap-4 pt-1.5 border-t border-rose-200/60 bg-rose-50/60 p-2 rounded">
                    <span className="text-rose-600 flex items-center gap-1.5 font-bold shrink-0">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Lý do hủy đơn:
                    </span>
                    <span className="font-bold text-rose-800 text-right">
                      {selectedOrderDetails.cancelReason}
                    </span>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase text-slate-400">
                  Danh Sách Sản Phẩm Đặt Mua ({selectedOrderDetails.items?.length || 0}):
                </h4>
                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
                  {selectedOrderDetails.items && selectedOrderDetails.items.length > 0 ? (
                    selectedOrderDetails.items.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.productImage || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80'}
                            alt={item.productName}
                            className="w-12 h-12 rounded-lg object-contain bg-slate-50 border border-slate-200 p-1 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-slate-900 uppercase truncate max-w-xs">{item.productName}</p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              Size {item.size} • {item.color || 'Bản Tiêu Chuẩn'} • SL: x{item.quantity}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono font-black text-slate-900">
                          {formatCurrency(Number(item.totalPrice || item.unitPrice * item.quantity))}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 italic py-2">
                      Không có thông tin chi tiết từng món.
                    </div>
                  )}
                </div>
              </div>

              {/* Total Summary */}
              <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between font-mono">
                <span className="text-xs font-bold uppercase text-slate-500">TỔNG GIÁ TRỊ ĐƠN HÀNG:</span>
                <span className="text-xl font-black text-[#DC2626]">
                  {formatCurrency(Number(selectedOrderDetails.totalAmount || 0))}
                </span>
              </div>

              {/* Workflow Actions trực tiếp trong Modal */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-mono font-bold text-slate-500 uppercase">
                  Thao Tác Duyệt Nhanh:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {(selectedOrderDetails.orderStatus || selectedOrderDetails.status) === 'PENDING' && (
                    <>
                      <button
                        type="button"
                        disabled={updatingOrderId === selectedOrderDetails.id}
                        onClick={() => handleApproveOrder(selectedOrderDetails.id, selectedOrderDetails.orderCode)}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Duyệt đơn ngay</span>
                      </button>

                      <button
                        type="button"
                        disabled={updatingOrderId === selectedOrderDetails.id}
                        onClick={() => setCancellingOrder(selectedOrderDetails)}
                        className="px-3 py-2 rounded-lg border border-rose-300 hover:bg-rose-50 text-rose-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Từ chối / Hủy</span>
                      </button>
                    </>
                  )}

                  {(selectedOrderDetails.orderStatus || selectedOrderDetails.status) === 'CONFIRMED' && (
                    <button
                      type="button"
                      disabled={updatingOrderId === selectedOrderDetails.id}
                      onClick={() => handleShipOrder(selectedOrderDetails.id, selectedOrderDetails.orderCode)}
                      className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                    >
                      <Truck className="w-4 h-4" />
                      <span>Xác nhận giao hàng</span>
                    </button>
                  )}

                  {['SHIPPING', 'SHIPPED'].includes(selectedOrderDetails.orderStatus || selectedOrderDetails.status) && (
                    <button
                      type="button"
                      disabled={updatingOrderId === selectedOrderDetails.id}
                      onClick={() => handleCompleteOrder(selectedOrderDetails.id, selectedOrderDetails.orderCode)}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Giao hàng thành công</span>
                    </button>
                  )}

                  {['DELIVERED', 'COMPLETED'].includes(selectedOrderDetails.orderStatus || selectedOrderDetails.status) && (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Đơn hàng đã hoàn thành trọn vẹn
                    </span>
                  )}

                  {(selectedOrderDetails.orderStatus || selectedOrderDetails.status) === 'CANCELLED' && (
                    <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> Đơn hàng đã hủy (Tồn kho đã hoàn lại)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: XÁC NHẬN HỦY ĐƠN & HOÀN TỒN KHO (RESTOCK) */}
      {/* ========================================================= */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
          <div
            onClick={() => setCancellingOrder(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          <div className="min-h-full flex items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase text-slate-900">
                    Xác Nhận Hủy Đơn Hàng
                  </h3>
                  <p className="text-xs font-mono text-slate-500">
                    MÃ ĐƠN: #{cancellingOrder.orderCode}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-700" /> Tự động hoàn lại tồn kho (Restock):
                </p>
                <p className="text-[11px] text-amber-700/90 leading-relaxed">
                  Toàn bộ số lượng giày trong đơn hàng này sẽ được tự động cộng ngược lại vào bảng tồn kho <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">product_variants</code>.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Lý do hủy đơn hàng:
                </label>
                <input
                  type="text"
                  value={cancelReasonInput}
                  onChange={(e) => setCancelReasonInput(e.target.value)}
                  placeholder="Nhập lý do hủy đơn..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 font-sans"
                />

                {/* Quick reason suggestions */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    'Khách yêu cầu hủy đơn',
                    'Không liên lạc được khách qua SĐT',
                    'Sai thông tin địa chỉ giao hàng',
                    'Hàng hóa lỗi trước khi đóng gói',
                  ].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setCancelReasonInput(sug)}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCancellingOrder(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Đóng lại
                </button>

                <button
                  type="button"
                  disabled={updatingOrderId === cancellingOrder.id}
                  onClick={handleConfirmCancelOrder}
                  className="px-4 py-2 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-red-600/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Xác nhận hủy & Hoàn kho</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: THÊM GIÀY MỚI KÈM 5 SIZE CHUẨN (36 - 40) */}
      {/* ========================================================= */}
      {isCreateProductModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
          <div
            onClick={() => !isSavingProduct && setIsCreateProductModalOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          <div className="min-h-full flex items-center justify-center p-4">
            <div className="relative w-full max-w-3xl bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-mono font-black uppercase">
                      TẠO MẪU GIÀY MỚI
                    </span>
                    <span className="text-xs font-mono text-slate-400">NEWMOS CATALOG // V3</span>
                  </div>
                  <h3 className="text-lg font-black uppercase text-slate-900 mt-1 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-red-600" />
                    Thêm Sản Phẩm Mới & Khởi Tạo 5 Size Chuẩn
                  </h3>
                </div>
                <button
                  type="button"
                  disabled={isSavingProduct}
                  onClick={() => setIsCreateProductModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreateProduct} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tên sản phẩm */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Tên sản phẩm giày <span className="text-red-500">*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: NewMos Nitro Runner X"
                      value={newProductForm.name}
                      onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-medium focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 font-sans"
                    />
                  </div>

                  {/* Giá bán niêm yết */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Giá niêm yết (VNĐ) <span className="text-red-500">*</span>:
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="10000"
                      placeholder="Ví dụ: 1450000"
                      value={newProductForm.price}
                      onChange={(e) => setNewProductForm({ ...newProductForm, price: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-mono font-bold text-red-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                  </div>

                  {/* Phối màu */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Tên phối màu:
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Trắng Phối Đỏ NewMos"
                      value={newProductForm.color}
                      onChange={(e) => setNewProductForm({ ...newProductForm, color: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-medium focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 font-sans"
                    />
                  </div>

                  {/* Danh mục */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Danh mục:
                    </label>
                    <select
                      value={newProductForm.categorySlug}
                      onChange={(e) => setNewProductForm({ ...newProductForm, categorySlug: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-medium focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-white"
                    >
                      {NEWMOS_CATEGORIES.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Link ảnh sản phẩm */}
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Link ảnh đại diện / Poster:
                    </label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="url"
                        placeholder="https://..."
                        value={newProductForm.imageUrl}
                        onChange={(e) => setNewProductForm({ ...newProductForm, imageUrl: e.target.value })}
                        className="flex-1 px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      />
                      {newProductForm.imageUrl && (
                        <img
                          src={newProductForm.imageUrl}
                          alt="Preview"
                          className="w-10 h-10 rounded-lg object-contain bg-slate-50 border border-slate-200 p-1 shrink-0"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80';
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Mô tả sản phẩm */}
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Mô tả sản phẩm:
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Mô tả công nghệ đệm, tính năng thoáng khí và phong cách thiết kế NewMos..."
                      value={newProductForm.description}
                      onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 font-sans"
                    />
                  </div>
                </div>

                {/* BẢNG NHẬP TỒN KHO NHANH CHO 5 SIZE CHUẨN (36 - 40) */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-slate-700 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-red-600" /> BẢNG KHỞI TẠO TỒN KHO CHO 5 SIZE CHUẨN (36, 37, 38, 39, 40):
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Tự động sinh mã SKU theo format NM-XXX
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {['36', '37', '38', '39', '40'].map((sz) => (
                      <div
                        key={sz}
                        className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-between"
                      >
                        <div className="text-center font-mono font-black text-sm text-slate-900 border-b border-slate-100 pb-1">
                          Size {sz}
                        </div>
                        <div className="mt-2 flex items-center justify-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            value={newProductForm.sizeStocks[sz]}
                            onChange={(e) =>
                              setNewProductForm({
                                ...newProductForm,
                                sizeStocks: {
                                  ...newProductForm.sizeStocks,
                                  [sz]: e.target.value,
                                },
                              })
                            }
                            className="w-16 px-2 py-1 text-center font-mono font-bold text-xs rounded border border-slate-300 focus:outline-none focus:border-red-500"
                          />
                          <span className="text-[11px] font-mono text-slate-400">đôi</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={isSavingProduct}
                    onClick={() => setIsCreateProductModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                  >
                    Hủy bỏ
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingProduct}
                    className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-md shadow-red-600/25 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isSavingProduct ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang lưu sản phẩm...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>LƯU SẢN PHẨM</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: SỬA THÔNG TIN SẢN PHẨM */}
      {/* ========================================================= */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
          <div
            onClick={() => !isSavingEdit && setEditingProduct(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          <div className="min-h-full flex items-center justify-center p-4">
            <div className="relative w-full max-w-2xl bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    MÃ: {editingProduct.productCode}
                  </span>
                  <h3 className="text-lg font-black uppercase text-slate-900 mt-1 flex items-center gap-2">
                    <Pencil className="w-5 h-5 text-red-600" />
                    Chỉnh Sửa Thông Tin Sản Phẩm
                  </h3>
                </div>
                <button
                  type="button"
                  disabled={isSavingEdit}
                  onClick={() => setEditingProduct(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateProduct} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tên */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Tên sản phẩm <span className="text-red-500">*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      value={editingProduct.productName}
                      onChange={(e) => setEditingProduct({ ...editingProduct, productName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-medium focus:outline-none focus:border-red-500"
                    />
                  </div>

                  {/* Giá bán */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Giá niêm yết (VNĐ):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      value={editingProduct.price || 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-mono font-bold text-red-600 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  {/* Phối màu */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Phối màu:
                    </label>
                    <input
                      type="text"
                      value={editingProduct.color || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, color: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-red-500"
                    />
                  </div>

                  {/* Danh mục */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Danh mục:
                    </label>
                    <select
                      value={editingProduct.categorySlug || 'the-thao-da-nang'}
                      onChange={(e) => setEditingProduct({ ...editingProduct, categorySlug: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-red-500"
                    >
                      {NEWMOS_CATEGORIES.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Link ảnh */}
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Link ảnh đại diện:
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="url"
                        value={editingProduct.defaultThumbnail || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, defaultThumbnail: e.target.value })}
                        className="flex-1 px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:border-red-500"
                      />
                      {editingProduct.defaultThumbnail && (
                        <img
                          src={editingProduct.defaultThumbnail}
                          alt="Thumbnail"
                          className="w-10 h-10 rounded-lg object-contain bg-slate-50 border border-slate-200 p-1 shrink-0"
                        />
                      )}
                    </div>
                  </div>

                  {/* Mô tả */}
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Mô tả:
                    </label>
                    <textarea
                      rows={3}
                      value={editingProduct.description || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-red-500 font-sans"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={isSavingEdit}
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                  >
                    Hủy bỏ
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isSavingEdit ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang cập nhật...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>CẬP NHẬT SẢN PHẨM</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: XÁC NHẬN XÓA / ẨN SẢN PHẨM KHỎI SHOP */}
      {/* ========================================================= */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
          <div
            onClick={() => !isDeletingProduct && setDeletingProduct(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          <div className="min-h-full flex items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-11 h-11 rounded-full flex items-center justify-center shrink-0 border',
                  deletingProduct.isActive
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                )}>
                  {deletingProduct.isActive ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black uppercase text-slate-900">
                    {deletingProduct.isActive ? 'Xác Nhận Ẩn Sản Phẩm' : 'Kích Hoạt Lại Sản Phẩm'}
                  </h3>
                  <p className="text-xs font-mono text-slate-500">
                    MÃ: {deletingProduct.productCode}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
                <p className="font-bold text-slate-900">
                  {deletingProduct.productName}
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {deletingProduct.isActive
                    ? 'Sản phẩm sẽ được ẩn khỏi trang Shop (/shop) để khách hàng không thể đặt mua. Toàn bộ lịch sử đơn hàng trước đây vẫn được lưu trữ an toàn.'
                    : 'Sản phẩm sẽ được hiển thị công khai trở lại trên trang Shop (/shop) để khách hàng có thể mua sắm bình thường.'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isDeletingProduct}
                  onClick={() => setDeletingProduct(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Đóng lại
                </button>

                <button
                  type="button"
                  disabled={isDeletingProduct}
                  onClick={handleToggleDeleteProduct}
                  className={cn(
                    'px-4 py-2 rounded-lg text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50',
                    deletingProduct.isActive
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                  )}
                >
                  {isDeletingProduct ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : deletingProduct.isActive ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>
                    {deletingProduct.isActive ? 'Xác nhận Ẩn sản phẩm' : 'Kích hoạt hiển thị'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}

export default AdminPage;
